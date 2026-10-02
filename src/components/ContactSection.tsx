import React, { useState } from 'react';
import { Mail, MessageCircle, Send, CheckCircle2, Clock, ArrowUpRight, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { SettingsData } from '../types';

interface ContactSectionProps {
  settings?: SettingsData;
  preselectedService?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ settings, preselectedService }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    project_type: preselectedService || 'Reels & Shorts Editing',
    message: '',
    brief_url: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Update project_type if preselectedService changes
  React.useEffect(() => {
    if (preselectedService) {
      setFormData((prev) => ({ ...prev, project_type: preselectedService }));
    }
  }, [preselectedService]);

  const projectTypes = [
    'Reels & Shorts Editing',
    'Commercial Video Editing',
    'YouTube Video Editing',
    'Social Media Ads',
    'Product Video Editing',
    'Color Grading & Mastering',
    'Motion Graphics & VFX',
    'Corporate Brand Film',
    'Full-Service Post-Production',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      await api.submitContact({ ...formData, budget: '' });
      setSubmitted(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C65D45', '#2B170F', '#F8F1E7'],
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const email = settings?.contact_email || 'afsar@ahmadfilms.studio';
  const whatsapp = settings?.whatsapp_number || '+15553829014';
  const instagram = settings?.instagram_url || 'https://instagram.com/afsarahmad.edits';
  const linkedin = settings?.linkedin_url || 'https://linkedin.com/in/afsarahmad-video';

  return (
    <section id="contact" className="py-24 md:py-36 bg-[#FFF9F2] relative overflow-hidden border-t border-[#2B170F]/10 font-montserrat">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Direct Pitch & Social Links */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="relative inline-flex items-center px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 shadow-[0_2px_10px_rgba(43,23,15,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] overflow-hidden mb-4">
                {/* Glass reflection highlights */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none" />
                <div className="absolute -top-3 -left-4 w-12 h-16 bg-gradient-to-r from-transparent via-white/60 to-transparent rotate-25 pointer-events-none" />
                <span className="relative z-10 text-xs font-sans font-bold uppercase text-[#C65D45] tracking-normal">
                  Start A Project
                </span>
              </div>

              <h2 className="font-pogonia text-4xl sm:text-6xl font-bold text-[#2B170F] leading-[1.08] mb-6">
                Have a video in mind?
              </h2>

              <p className="text-base sm:text-lg font-medium text-[#756A62] leading-relaxed mb-8">
                Whether you need a high-retention short-form reel pipeline, a commercial broadcast spot, or a narrative brand documentary, let's bring your vision to life with precision rhythm.
              </p>

              {/* Response Promise */}
              <div className="p-5 rounded-2xl bg-[#F8F1E7] border border-[#2B170F]/10 space-y-3 mb-10">
                <div className="flex items-center gap-3 text-xs text-[#756A62]">
                  <Clock className="w-4 h-4 text-[#C65D45]" />
                  <span>24-Hour Response Time Guaranteed</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#756A62]">
                  <CheckCircle2 className="w-4 h-4 text-[#C65D45]" />
                  <span>Direct collaboration with the editor (no agency middlemen or managers)</span>
                </div>
              </div>
            </div>

            {/* Direct Connect Buttons */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#756A62] block mb-2">
                Direct Channels
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`mailto:${email}`}
                  className="p-3.5 rounded-xl bg-[#F8F1E7] hover:bg-[#ece4da] border border-[#2B170F]/10 shadow-sm flex items-center justify-between text-xs text-[#2B170F] group transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#C65D45]" />
                    <span className="font-medium truncate max-w-[150px]">{email}</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#756A62] group-hover:text-[#C65D45] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>

                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl bg-[#F8F1E7] hover:bg-[#ece4da] border border-[#2B170F]/10 shadow-sm flex items-center justify-between text-xs text-[#2B170F] group transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-[#C65D45]" />
                    <span className="font-medium">WhatsApp Chat</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#756A62] group-hover:text-[#C65D45] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>

                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl bg-[#F8F1E7] hover:bg-[#ece4da] border border-[#2B170F]/10 shadow-sm flex items-center justify-between text-xs text-[#2B170F] group transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-[#C65D45] fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span className="font-medium">Instagram</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#756A62] group-hover:text-[#C65D45] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>

                <a
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl bg-[#F8F1E7] hover:bg-[#ece4da] border border-[#2B170F]/10 shadow-sm flex items-center justify-between text-xs text-[#2B170F] group transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-[#C65D45] fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    <span className="font-medium">LinkedIn</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#756A62] group-hover:text-[#C65D45] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Inquiry Form */}
          <div className="lg:col-span-7">

            {/* Primary CTA: WhatsApp */}
            <a
              href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full mb-5 px-6 py-5 rounded-2xl bg-[#2B170F] hover:bg-[#3E2217] transition-all group shadow-lg shadow-[#2B170F]/20 active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                {/* WhatsApp icon */}
                <div className="w-11 h-11 rounded-xl bg-[#25D366] flex items-center justify-center shrink-0 shadow-md">
                  <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-[#FFF9F2] font-pogonia text-lg font-bold leading-tight">Chat on WhatsApp</div>
                  <div className="text-[#FFF9F2]/60 text-xs font-montserrat mt-0.5">Fastest response · Usually replies within an hour</div>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-[#FFF9F2]/50 group-hover:text-[#C65D45] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </a>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex-1 h-px bg-[#2B170F]/10" />
              <span className="text-[11px] font-bold uppercase text-[#756A62] tracking-wider whitespace-nowrap">Or fill the form</span>
              <div className="flex-1 h-px bg-[#2B170F]/10" />
            </div>

            <div className="p-8 sm:p-10 rounded-3xl bg-[#F8F1E7] border border-[#2B170F]/10 shadow-xl relative">
              {submitted ? (
                <div className="py-16 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 rounded-full bg-[#C65D45]/20 text-[#2B170F] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-[#C65D45]" />
                  </div>
                  <h3 className="font-pogonia text-3xl sm:text-4xl text-[#2B170F] font-bold">
                    Inquiry Received
                  </h3>
                  <p className="text-sm font-medium text-[#756A62] max-w-md mx-auto leading-relaxed">
                    Thank you, {formData.name}! I have received your project details and brief. I will review your requirements and reach back out within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        company: '',
                        project_type: 'Reels & Shorts Editing',
                        message: '',
                        brief_url: '',
                      });
                    }}
                    className="group/again relative mt-6 px-6 py-2.5 rounded-full overflow-hidden text-xs font-black uppercase tracking-widest text-[#FFF9F2] bg-gradient-to-r from-[#C65D45] via-[#D8684F] to-[#E2725B] shadow-[0_4px_18px_rgba(198,93,69,0.45)] hover:shadow-[0_6px_24px_rgba(198,93,69,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 border border-[#E2725B]/40"
                  >
                    <span className="absolute inset-0 -translate-x-full group-hover/again:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                    <span className="relative">Send Another Message</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {errorMsg && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#2B170F] mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Jordan Hayes"
                        className="w-full px-4 py-3.5 rounded-xl bg-[#FFF9F2] border border-[#2B170F]/15 text-[#2B170F] placeholder-[#756A62]/50 text-sm focus:outline-none focus:border-[#C65D45] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#2B170F] mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="jordan@company.com"
                        className="w-full px-4 py-3.5 rounded-xl bg-[#FFF9F2] border border-[#2B170F]/15 text-[#2B170F] placeholder-[#756A62]/50 text-sm focus:outline-none focus:border-[#C65D45] transition-all"
                      />
                    </div>
                  </div>

                  {/* Company & Project Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#2B170F] mb-2">
                        Company or Channel Name
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="e.g. Hyperion Media / Personal Brand"
                        className="w-full px-4 py-3.5 rounded-xl bg-[#FFF9F2] border border-[#2B170F]/15 text-[#2B170F] placeholder-[#756A62]/50 text-sm focus:outline-none focus:border-[#C65D45] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#2B170F] mb-2">
                        Project Type *
                      </label>
                      <select
                        value={formData.project_type}
                        onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-xl bg-[#FFF9F2] border border-[#2B170F]/15 text-[#2B170F] text-sm focus:outline-none focus:border-[#C65D45] transition-all"
                      >
                        {projectTypes.map((pt) => (
                          <option key={pt} value={pt} className="bg-[#FFF9F2] text-[#2B170F]">
                            {pt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Project Brief / Reference URL */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#2B170F] mb-2">
                      Footage Drive Link or Reference URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.brief_url}
                      onChange={(e) => setFormData({ ...formData, brief_url: e.target.value })}
                      placeholder="https://drive.google.com/... or Vimeo / YouTube link"
                      className="w-full px-4 py-3.5 rounded-xl bg-[#FFF9F2] border border-[#2B170F]/15 text-[#2B170F] placeholder-[#756A62]/50 text-sm focus:outline-none focus:border-[#C65D45] transition-all"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#2B170F] mb-2">
                      Tell Me About The Project & Timeline *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Brief summary of your vision, target audience, raw footage volume, and desired delivery date..."
                      className="w-full px-4 py-3 rounded-xl bg-[#FFF9F2] border border-[#2B170F]/15 text-[#2B170F] placeholder-[#756A62]/50 text-sm focus:outline-none focus:border-[#C65D45] transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group/submit relative w-full py-4 rounded-full overflow-hidden text-sm font-black uppercase tracking-widest text-[#FFF9F2] bg-gradient-to-r from-[#C65D45] via-[#D8684F] to-[#E2725B] shadow-[0_6px_28px_rgba(198,93,69,0.5),inset_0_1px_1px_rgba(255,255,255,0.35)] hover:shadow-[0_8px_36px_rgba(198,93,69,0.7)] hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 border border-[#E2725B]/40"
                  >
                    <span className="absolute inset-0 -translate-x-full group-hover/submit:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                    {loading ? (
                      <span className="relative">Submitting Inquiry...</span>
                    ) : (
                      <>
                        <span className="relative">Submit Project Inquiry</span>
                        <Send className="relative w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
