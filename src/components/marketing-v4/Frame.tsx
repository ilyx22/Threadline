/**
 * A native content object with a recognisable silhouette — the "expression
 * frame" of the object language. Seven kinds; each looks like what it is.
 */
export type FrameKind = 'post' | 'video' | 'doc' | 'proof' | 'deep' | 'diagnostic' | 'nurture';

export function Frame({ kind, label, className = '' }: { kind: FrameKind; label: string; className?: string }) {
  return (
    <div className={`frame is-${kind} ${className}`} aria-hidden="true">
      <div className="frame-head">
        <span className="frame-avatar" />
        <span className="frame-kind">{label}</span>
      </div>
      {kind === 'post' && (<><span className="frame-line is-ink is-w80" /><span className="frame-line is-w90" /><span className="frame-line is-w60" /></>)}
      {kind === 'video' && (<><div className="frame-video" /><span className="frame-line is-w60" /></>)}
      {kind === 'doc' && (<><div className="frame-pages"><span /><span /><span /></div><span className="frame-line is-w40" /></>)}
      {kind === 'proof' && (<><span className="frame-line is-ink is-w60" /><span className="frame-line is-w80" /><span className="frame-stamp">Method · shown</span></>)}
      {kind === 'deep' && (<><span className="frame-line is-ink is-w90" /><span className="frame-line is-w90" /><span className="frame-line is-w90" /><span className="frame-line is-w80" /><span className="frame-line is-w60" /></>)}
      {kind === 'diagnostic' && (<><div className="frame-check is-done"><span className="frame-line is-w80" /></div><div className="frame-check is-done"><span className="frame-line is-w60" /></div><div className="frame-check"><span className="frame-line is-w90" /></div></>)}
      {kind === 'nurture' && (<><div className="frame-envelope" /><span className="frame-line is-w60" /></>)}
    </div>
  );
}

export default Frame;
