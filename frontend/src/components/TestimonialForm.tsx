import { useState } from 'react';
import { apiUrl } from '../lib/api';

export default function TestimonialForm() {
  const [busy,setBusy] = useState(false);
  const [feedback,setFeedback] = useState('');
  return <details className="win p-4 mt-4"><summary className="mono t-green">Leave a testimonial</summary>
    <p className="mt-3">Worked with me, built something together, or know me personally? Share your experience. Every submission is reviewed before publication.</p>
    <form onSubmit={async e => {
      e.preventDefault(); const form=e.currentTarget; setBusy(true); setFeedback('');
      try {
        const response=await fetch(apiUrl('reviews/submit'),{method:'POST',body:new FormData(form)});
        const result=await response.json(); if(!response.ok) throw new Error(result.error || 'Could not submit. Please try again.');
        setFeedback(result.message); form.reset();
      } catch(error) { setFeedback(error instanceof Error ? error.message : 'Could not submit. Please try again.'); }
      finally {setBusy(false);}
    }}>
      <div className="personal-grid">{[
        ['name','Full name','text'],['email','Email (private)','email'],['role','Current role or occupation','text'],['company','Company / organisation (or Independent)','text'],['relationship','How do you know Het?','text'],
      ].map(([name,label,type]) => <label key={name} className="d-block mb-3">{label}<input className="form-control" name={name} type={type} required maxLength={200} /></label>)}</div>
      <label className="d-block mb-3">Work experience<textarea className="form-control" name="experience" required maxLength={3000} rows={3} placeholder="Roles, organisations, and how long you worked there" /></label>
      <label className="d-block mb-3">Your testimonial<textarea className="form-control" name="message" required maxLength={3000} rows={4} /></label>
      <label className="d-block mb-3">Your photo — JPG, PNG or WebP, maximum 250 KB<input className="form-control" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required onChange={e => { const file=e.target.files?.[0]; e.target.setCustomValidity(file && file.size>250000 ? 'Choose a photo smaller than 250 KB.' : ''); }} /></label>
      <label className="d-block mb-3"><input name="consent" type="checkbox" value="yes" required /> I agree to publish my name, photo, role, organisation, work experience, relationship and testimonial if approved. My email stays private.</label>
      <button className="btn-term" disabled={busy}>{busy?'Sending…':'Submit for review'}</button><p role="status" className="mt-3">{feedback}</p>
    </form>
  </details>;
}
