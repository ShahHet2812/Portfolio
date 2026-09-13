import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '../lib/api';
import { preparePortrait } from '../lib/portrait';

export default function TestimonialForm() {
  const [busy,setBusy] = useState(false);
  const [feedback,setFeedback] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [processing, setProcessing] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const selection = useRef(0);
  useEffect(() => () => { selection.current += 1; }, []);
  useEffect(() => {
    if (!photo) { setPreview(''); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  return <details className="win p-4 mt-4"><summary className="mono t-green">Leave a testimonial</summary>
    <p className="mt-3">Worked with me, built something together, or know me personally? Share your experience. Every submission is reviewed before publication.</p>
    <form onSubmit={async e => {
      e.preventDefault();
      if (busy || processing || !photo) return;
      const form=e.currentTarget; setBusy(true); setFeedback('');
      try {
        const data = new FormData(form);
        data.set('photo', photo);
        const response=await fetch(apiUrl('reviews/submit'),{method:'POST',body:data});
        const result=await response.json(); if(!response.ok) throw new Error(result.error || 'Could not submit. Please try again.');
        setFeedback(result.message); form.reset(); setPhoto(null); setPhotoError('');
      } catch(error) { setFeedback(error instanceof Error ? error.message : 'Could not submit. Please try again.'); }
      finally {setBusy(false);}
    }}>
      <div className="personal-grid">{[
        ['name','Full name','text'],['email','Email (private)','email'],['role','Current role or occupation','text'],['company','Company / organisation (or Independent)','text'],['relationship','How do you know Het?','text'],
      ].map(([name,label,type]) => <label key={name} className="d-block mb-3">{label}<input className="form-control" name={name} type={type} required maxLength={200} /></label>)}</div>
      <label className="d-block mb-3">Work experience<textarea className="form-control" name="experience" required maxLength={3000} rows={3} placeholder="Roles, organisations, and how long you worked there" /></label>
      <label className="d-block mb-3">Your testimonial<textarea className="form-control" name="message" required maxLength={3000} rows={4} /></label>
      <label className="d-block mb-3">Your photo
        <input className="form-control" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required disabled={busy} aria-describedby="photo-help photo-status" aria-invalid={!!photoError} onChange={async e => {
          const input = e.currentTarget;
          const file = input.files?.[0];
          const version = ++selection.current;
          setPhoto(null); setPhotoError(''); setProcessing(false); input.setCustomValidity('');
          if (!file) return;
          setProcessing(true);
          try {
            const prepared = await preparePortrait(file);
            if (version === selection.current) setPhoto(prepared);
          } catch (error) {
            if (version !== selection.current) return;
            const message = error instanceof Error ? error.message : 'Could not prepare this photo.';
            setPhotoError(message); input.setCustomValidity(message);
          } finally {
            if (version === selection.current) setProcessing(false);
          }
        }} />
      </label>
      <p id="photo-help" className="t-dim">Choose a JPG, PNG or WebP up to 20 MB. We’ll resize it automatically before uploading.</p>
      <p id="photo-status" role="status">{processing ? 'Preparing your photo…' : photoError || (photo ? 'Photo ready. Preview below.' : '')}</p>
      {preview && photo && <figure><img src={preview} alt="Your testimonial photo preview" style={{ width: 160, maxHeight: 200, objectFit: 'contain', borderRadius: 8 }} /><figcaption className="t-dim">{Math.ceil(photo.size / 1024)} KB · Ready to submit</figcaption></figure>}
      <label className="d-block mb-3"><input name="consent" type="checkbox" value="yes" required /> I agree to publish my name, photo, role, organisation, work experience, relationship and testimonial if approved. My email stays private.</label>
      <button className="btn-term" disabled={busy || processing || !photo}>{busy?'Sending…':processing?'Preparing photo…':'Submit for review'}</button><p role="status" className="mt-3">{feedback}</p>
    </form>
  </details>;
}
