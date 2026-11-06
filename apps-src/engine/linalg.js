/* Small dense linear algebra for model fitting: arrays of rows (number[][]).
 * Least squares go through Householder QR (stable when predictors are correlated);
 * symmetric positive-definite systems through Cholesky. */

export const zeros = (r, c) => Array.from({ length: r }, () => new Array(c).fill(0));
export const transpose = (A) => A[0].map((_, j) => A.map((r) => r[j]));

export function matmul(A, B) {
  const n = A.length, m = B[0].length, k = B.length;
  const C = zeros(n, m);
  for (let i = 0; i < n; i++) for (let p = 0; p < k; p++) { const a = A[i][p]; if (a) for (let j = 0; j < m; j++) C[i][j] += a * B[p][j]; }
  return C;
}

/** X'WX and X'Wz for weighted least squares (w optional). */
export function crossprod(X, w = null) {
  const p = X[0].length, M = zeros(p, p);
  for (let i = 0; i < X.length; i++) {
    const wi = w ? w[i] : 1, row = X[i];
    for (let a = 0; a < p; a++) { const ra = row[a] * wi; if (ra) for (let b = a; b < p; b++) M[a][b] += ra * row[b]; }
  }
  for (let a = 0; a < p; a++) for (let b = 0; b < a; b++) M[a][b] = M[b][a];
  return M;
}

/** Cholesky factor L (lower) of a symmetric positive-definite matrix; null when not positive definite. */
export function cholesky(A) {
  const n = A.length, L = zeros(n, n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = A[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) {
        if (!(s > 1e-13 * Math.max(1, Math.abs(A[i][i])))) return null;
        L[i][i] = Math.sqrt(s);
      } else L[i][j] = s / L[j][j];
    }
  }
  return L;
}

/** Inverse of a symmetric positive-definite matrix; null when singular. */
export function invSPD(A) {
  const L = cholesky(A);
  if (!L) return null;
  const n = A.length;
  // Invert L, then A^-1 = L^-T L^-1.
  const Li = zeros(n, n);
  for (let i = 0; i < n; i++) {
    Li[i][i] = 1 / L[i][i];
    for (let j = 0; j < i; j++) {
      let s = 0;
      for (let k = j; k < i; k++) s -= L[i][k] * Li[k][j];
      Li[i][j] = s / L[i][i];
    }
  }
  const inv = zeros(n, n);
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
    let s = 0;
    for (let k = i; k < n; k++) s += Li[k][i] * Li[k][j];
    inv[i][j] = s; inv[j][i] = s;
  }
  return inv;
}

/** Solve A x = b for symmetric positive-definite A. */
export function solveSPD(A, b) {
  const L = cholesky(A);
  if (!L) return null;
  const n = b.length, y = new Array(n), x = new Array(n);
  for (let i = 0; i < n; i++) { let s = b[i]; for (let k = 0; k < i; k++) s -= L[i][k] * y[k]; y[i] = s / L[i][i]; }
  for (let i = n - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k]; x[i] = s / L[i][i]; }
  return x;
}

/**
 * Least squares by Householder QR. Returns { beta, R, rank } or null when X is rank deficient.
 * (X'X)^-1 = R^-1 R^-T is formed from R, not from X'X.
 */
export function lstsq(X, y) {
  const n = X.length, p = X[0].length;
  const A = X.map((r) => r.slice());
  const b = y.slice();
  const R = zeros(p, p);
  for (let k = 0; k < p; k++) {
    let norm = 0;
    for (let i = k; i < n; i++) norm += A[i][k] * A[i][k];
    norm = Math.sqrt(norm);
    if (norm === 0) return null;
    const alpha = A[k][k] > 0 ? -norm : norm;
    const v = new Array(n).fill(0);
    v[k] = A[k][k] - alpha;
    for (let i = k + 1; i < n; i++) v[i] = A[i][k];
    let vv = 0;
    for (let i = k; i < n; i++) vv += v[i] * v[i];
    if (vv > 0) {
      for (let j = k; j < p; j++) {
        let s = 0;
        for (let i = k; i < n; i++) s += v[i] * A[i][j];
        const f = (2 * s) / vv;
        for (let i = k; i < n; i++) A[i][j] -= f * v[i];
      }
      let s = 0;
      for (let i = k; i < n; i++) s += v[i] * b[i];
      const f = (2 * s) / vv;
      for (let i = k; i < n; i++) b[i] -= f * v[i];
    }
  }
  for (let i = 0; i < p; i++) for (let j = i; j < p; j++) R[i][j] = A[i][j];
  const scale = Math.max(...R.map((r, i) => Math.abs(r[i])));
  const rank = R.filter((r, i) => Math.abs(r[i]) > 1e-10 * scale).length;
  if (rank < p) return { rank, beta: null, R };
  const beta = new Array(p);
  for (let i = p - 1; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < p; j++) s -= R[i][j] * beta[j]; beta[i] = s / R[i][i]; }
  return { beta, R, rank };
}

/** (R'R)^-1 from the upper-triangular R of a QR factorisation. */
export function invFromR(R) {
  const p = R.length, Ri = zeros(p, p);
  for (let i = p - 1; i >= 0; i--) {
    Ri[i][i] = 1 / R[i][i];
    for (let j = i + 1; j < p; j++) {
      let s = 0;
      for (let k = i + 1; k <= j; k++) s += R[i][k] * Ri[k][j];
      Ri[i][j] = -s / R[i][i];
    }
  }
  const out = zeros(p, p);
  for (let i = 0; i < p; i++) for (let j = i; j < p; j++) {
    let s = 0;
    for (let k = j; k < p; k++) s += Ri[i][k] * Ri[j][k];
    out[i][j] = s; out[j][i] = s;
  }
  return out;
}
