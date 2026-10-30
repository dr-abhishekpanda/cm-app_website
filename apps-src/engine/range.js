/* Studentized range distribution, for Tukey HSD and Games-Howell comparisons.
 * Copenhaver and Holland (1988), as implemented in R's ptukey.c: Gauss-Legendre quadrature
 * of Hartley's form, then over the chi distribution of the standard error.
 * Checked against scipy.stats.studentized_range in tests/engine/range.test.mjs.
 */
import { lnGamma, brent } from './special.js';
import { normal } from './dist.js';

const SQRT_2PI = Math.sqrt(2 * Math.PI);

const XLEG = [0.981560634246719250690549090149, 0.904117256370474856678465866119, 0.769902674194304687036893833213,
  0.587317954286617447296702418941, 0.367831498998180193752691536644, 0.125233408511468915472441369464];
const ALEG = [0.047175336386511827194615961485, 0.106939325995318430960254718194, 0.160078328543346226334652529543,
  0.203167426723065921749064455810, 0.233492536538354808760849898925, 0.249147045813402785000562436043];

// P(range of cc standard normals < w), raised to the power rr (number of ranges).
function wprob(w, rr, cc) {
  const nleg = 12, ihalf = 6, C1 = -30, C2 = -50, C3 = 60, bb = 8, wlar = 3;
  const qsqz = w * 0.5;
  if (qsqz >= bb) return 1;
  let prW = 2 * normal.cdf(qsqz) - 1;
  prW = prW >= Math.exp(C2 / cc) ? Math.pow(prW, cc) : 0;
  const wincr = w > wlar ? 2 : 3;
  let blb = qsqz;
  const binc = (bb - qsqz) / wincr;
  let bub = blb + binc;
  let einsum = 0;
  const cc1 = cc - 1;
  for (let wi = 1; wi <= wincr; wi++) {
    let elsum = 0;
    const a = 0.5 * (bub + blb);
    const b = 0.5 * (bub - blb);
    for (let jj = 1; jj <= nleg; jj++) {
      let j, xx;
      if (ihalf < jj) { j = nleg - jj + 1; xx = XLEG[j - 1]; }
      else { j = jj; xx = -XLEG[j - 1]; }
      const c = b * xx;
      const ac = a + c;
      const qexpo = ac * ac;
      if (qexpo > C3) break;
      const pplus = 2 * normal.cdf(ac);
      const pminus = 2 * normal.cdf(ac - w);
      let rinsum = pplus * 0.5 - pminus * 0.5;
      if (rinsum >= Math.exp(C1 / cc1)) {
        rinsum = ALEG[j - 1] * Math.exp(-(0.5 * qexpo)) * Math.pow(rinsum, cc1);
        elsum += rinsum;
      }
    }
    elsum *= (2 * b * cc) / SQRT_2PI;
    einsum += elsum;
    blb = bub;
    bub += binc;
  }
  prW += einsum;
  if (prW <= Math.exp(C1 / rr)) return 0;
  prW = Math.pow(prW, rr);
  return prW >= 1 ? 1 : prW;
}

const XLEGQ = [0.989400934991649932596154173450, 0.944575023073232576077988415535, 0.865631202387831743880467897712,
  0.755404408355003033895101194847, 0.617876244402643748446671764049, 0.458016777657227386342419442984,
  0.281603550779258913230460501460, 0.950125098376374401853193354250e-1];
const ALEGQ = [0.271524594117540948517805724560e-1, 0.622535239386478928628438369944e-1, 0.951585116824927848099251076022e-1,
  0.124628971255533872052476282192, 0.149595988816576732081501730547, 0.169156519395002538189312079030,
  0.182603415044923588866763667969, 0.189450610455068496285396723208];

/** P(Q < q) for the studentized range of k means with df error degrees of freedom. */
function ptukey(q, k, df, rr = 1) {
  if (q <= 0) return 0;
  if (!(df >= 2) || k < 2) return NaN;
  if (!Number.isFinite(q)) return 1;
  if (df > 25000) return wprob(q, rr, k);
  const nlegq = 16, ihalfq = 8, eps1 = -30, eps2 = 1e-14;
  const f2 = df * 0.5;
  let f2lf = f2 * Math.log(df) - df * Math.LN2 - lnGamma(f2);
  const f21 = f2 - 1;
  const ff4 = df * 0.25;
  const ulen = df <= 100 ? 1 : df <= 800 ? 0.5 : df <= 5000 ? 0.25 : 0.125;
  f2lf += Math.log(ulen);
  let ans = 0, otsum = 0;
  for (let i = 1; i <= 50; i++) {
    otsum = 0;
    const twa1 = (2 * i - 1) * ulen;
    for (let jj = 1; jj <= nlegq; jj++) {
      let j, t1;
      if (ihalfq < jj) {
        j = jj - ihalfq - 1;
        t1 = f2lf + f21 * Math.log(twa1 + XLEGQ[j] * ulen) - (XLEGQ[j] * ulen + twa1) * ff4;
      } else {
        j = jj - 1;
        t1 = f2lf + f21 * Math.log(twa1 - XLEGQ[j] * ulen) + (XLEGQ[j] * ulen - twa1) * ff4;
      }
      if (t1 >= eps1) {
        const qsqz = ihalfq < jj ? q * Math.sqrt((XLEGQ[j] * ulen + twa1) * 0.5) : q * Math.sqrt((-(XLEGQ[j] * ulen) + twa1) * 0.5);
        otsum += wprob(qsqz, rr, k) * ALEGQ[j] * Math.exp(t1);
      }
    }
    if (i * ulen >= 1 && otsum <= eps2) break;
    ans += otsum;
  }
  return Math.min(ans, 1);
}

export const studentizedRange = {
  cdf: (q, k, df) => ptukey(q, k, df),
  // Upper tail as 1 - cdf: accurate to about 1e-9 absolute, so very small p-values are reported as bounds.
  sf: (q, k, df) => Math.max(0, 1 - ptukey(q, k, df)),
  ppf(p, k, df) {
    if (!(p > 0 && p < 1)) return NaN;
    let hi = 2;
    while (ptukey(hi, k, df) < p && hi < 1e4) hi *= 2;
    return brent((q) => ptukey(q, k, df) - p, 0, hi, 1e-12);
  },
};
