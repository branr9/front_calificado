import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, concatMap, takeWhile, timeout } from 'rxjs/operators';

import { environment } from '../config/environment';
import {
  RevisionGeneralDetailDTO,
  RevisionGeneralJobDTO,
  RevisionGeneralStatus
} from '../models/revision-general.model';

const TERMINAL_STATES: RevisionGeneralStatus[] = ['COMPLETED', 'FAILED'];

const DEFAULT_POLL_INTERVAL_MS = 3_000;
const DEFAULT_POLL_TIMEOUT_MS = 5 * 60 * 1_000; // 5 minutes max

@Injectable({ providedIn: 'root' })
export class RevisionGeneralService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/registro-calificado`;

  /**
   * Start a new asynchronous review job. The response is immediate (HTTP 202)
   * with status = PENDING. Callers must poll {@link pollJob} until the status
   * reaches a terminal state.
   */
  startJob(
    programaId: number,
    opts: { advanced?: boolean; rag?: boolean } = {}
  ): Observable<RevisionGeneralJobDTO> {
    let params = new HttpParams();
    if (opts.advanced !== undefined) {
      params = params.set('advanced', String(opts.advanced));
    }
    if (opts.rag !== undefined) {
      params = params.set('rag', String(opts.rag));
    }
    return this.http.post<RevisionGeneralJobDTO>(
      `${this.apiUrl}/programa/${programaId}/ia/revision-general`,
      {},
      { params }
    );
  }

  /** Get the lightweight status of a single job (no findings). */
  getJobStatus(requestId: string): Observable<RevisionGeneralJobDTO> {
    return this.http.get<RevisionGeneralJobDTO>(
      `${this.apiUrl}/ia/revisiones/${requestId}/status`
    );
  }

  /** Get the full persisted snapshot (header + findings) for a review. */
  getDetail(requestId: string): Observable<RevisionGeneralDetailDTO> {
    return this.http.get<RevisionGeneralDetailDTO>(
      `${this.apiUrl}/ia/revisiones/${requestId}`
    );
  }

  /** Historical list of reviews for a program, newest first. */
  listByPrograma(programaId: number): Observable<RevisionGeneralJobDTO[]> {
    return this.http.get<RevisionGeneralJobDTO[]>(
      `${this.apiUrl}/programa/${programaId}/ia/revisiones`
    );
  }

  /**
   * Poll the job status endpoint at a fixed cadence and emit each snapshot to
   * the subscriber. The Observable completes when the status becomes
   * {@code COMPLETED} or {@code FAILED}, or errors if the overall timeout is
   * hit. The component is responsible for unsubscribing (e.g. when the panel
   * closes) to stop polling early.
   */
  pollJob(
    requestId: string,
    options: { intervalMs?: number; timeoutMs?: number } = {}
  ): Observable<RevisionGeneralJobDTO> {
    const interval = options.intervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const total = options.timeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;

    return timer(0, interval).pipe(
      concatMap(() =>
        this.getJobStatus(requestId).pipe(
          catchError((err) =>
            // Transient errors must not kill the polling loop. We re-emit a
            // failed status so the consumer can render the message and the
            // takeWhile below will stop the stream cleanly.
            of<RevisionGeneralJobDTO>({
              id: 0,
              requestId,
              programaId: null,
              programaNombre: null,
              status: 'FAILED',
              errorMessage:
                err?.error?.error ||
                err?.message ||
                'No se pudo consultar el estado de la revisión.',
              createdAt: new Date().toISOString(),
              startedAt: null,
              completedAt: new Date().toISOString(),
              positiveCount: 0,
              improvementCount: 0
            })
          )
        )
      ),
      // Emit the terminal value too, then complete.
      takeWhile((job) => !TERMINAL_STATES.includes(job.status), true),
      timeout({
        each: total,
        with: () =>
          throwError(
            () => new Error('La revisión está tardando demasiado. Reintenta más tarde.')
          )
      })
    );
  }
}
