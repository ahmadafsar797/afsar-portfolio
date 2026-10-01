import React from 'react';
import { Play, Sparkles, CheckCircle2, Cpu, FileText, Target, ArrowUpRight } from 'lucide-react';
import { Project } from '../types';
import { BeforeAfterSlider } from './BeforeAfterSlider';

interface SelectedProjectsProps {
  projects: Project[];
  onOpenLightbox: (videoUrl: string, title: string, client?: string, category?: string) => void;
}

export const SelectedProjects: React.FC<SelectedProjectsProps> = ({ projects, onOpenLightbox }) => {
  return (
    <section id="case-studies" className="py-24 md:py-36 bg-[#F8F1E7] relative overflow-hidden border-t border-[#2B170F]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="relative inline-flex items-center px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 shadow-[0_2px_10px_rgba(43,23,15,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] overflow-hidden mb-3">
              {/* Glass reflection highlights */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none" />
              <div className="absolute -top-3 -left-4 w-12 h-16 bg-gradient-to-r from-transparent via-white/60 to-transparent rotate-25 pointer-events-none" />
              <span className="relative z-10 text-xs font-montserrat font-bold uppercase text-[#C65D45] tracking-normal">
                In-Depth Editorial Breakdowns
              </span>
            </div>
            <h2 className="font-pogonia text-4xl sm:text-6xl font-bold text-[#2B170F]">
              Selected Case Studies
            </h2>
          </div>
          <p className="text-sm font-montserrat font-medium text-[#756A62] max-w-md">
            Behind-the-scenes breakdowns revealing how narrative pacing, sound architecture, and surgical color grading translate client visions into measurable cultural impact.
          </p>
        </div>

        {/* Case Studies List */}
        <div className="space-y-24 lg:space-y-36">
          {projects.map((project, idx) => (
            <div
              key={project.id || idx}
              className="p-8 sm:p-12 rounded-3xl bg-[#FFF9F2] border border-[#2B170F]/10 hover:border-[#C65D45] transition-all duration-500 shadow-md hover:shadow-xl"
            >
              {/* Top Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#2B170F]/10 mb-8">
                <div>
                  <span className="text-xs font-montserrat uppercase font-semibold tracking-wider text-[#C65D45] block mb-1">
                    {project.client} • {project.category}
                  </span>
                  <h3 className="font-pogonia text-3xl sm:text-5xl font-bold text-[#2B170F]">
                    {project.title}
                  </h3>
                </div>

                <button
                  onClick={() => onOpenLightbox(project.video_url, project.title, project.client, project.category)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-montserrat uppercase font-bold tracking-wider text-[#2B170F] bg-[#C65D45] hover:bg-[#a84d38] shadow-md shadow-[#C65D45]/20 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Final Edit</span>
                </button>
              </div>

              {/* 2-Column Showcase */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                {/* Left Column: Storytelling Brief & Process */}
                <div className="lg:col-span-6 space-y-6">
                  {/* Brief */}
                  {project.brief && (
                    <div className="p-6 rounded-2xl bg-[#F8F1E7] border border-[#2B170F]/10">
                      <div className="flex items-center gap-2 text-xs font-montserrat uppercase tracking-wider text-[#756A62] font-semibold mb-2">
                        <Target className="w-4 h-4 text-[#C65D45]" />
                        <span>The Creative Brief</span>
                      </div>
                      <p className="text-sm font-montserrat font-medium text-[#756A62] leading-relaxed">
                        {project.brief}
                      </p>
                    </div>
                  )}

                  {/* Approach */}
                  {project.approach && (
                    <div className="p-6 rounded-2xl bg-[#F8F1E7] border border-[#2B170F]/10">
                      <div className="flex items-center gap-2 text-xs font-montserrat uppercase tracking-wider text-[#756A62] font-semibold mb-2">
                        <FileText className="w-4 h-4 text-[#C65D45]" />
                        <span>Editing & Narrative Strategy</span>
                      </div>
                      <p className="text-sm font-montserrat font-medium text-[#756A62] leading-relaxed">
                        {project.approach}
                      </p>
                    </div>
                  )}

                  {/* Software & Deliverables */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {project.software_used && (
                      <div className="p-4 rounded-xl bg-[#F8F1E7] border border-[#2B170F]/10">
                        <div className="flex items-center gap-1.5 text-[11px] font-montserrat uppercase tracking-wider text-[#756A62] font-semibold mb-1.5">
                          <Cpu className="w-3.5 h-3.5 text-[#C65D45]" />
                          <span>Software Suite</span>
                        </div>
                        <p className="text-xs font-bold font-montserrat text-[#2B170F]">
                          {project.software_used}
                        </p>
                      </div>
                    )}

                    {project.deliverables && (
                      <div className="p-4 rounded-xl bg-[#F8F1E7] border border-[#2B170F]/10">
                        <div className="flex items-center gap-1.5 text-[11px] font-montserrat uppercase tracking-wider text-[#756A62] font-semibold mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C65D45]" />
                          <span>Deliverables</span>
                        </div>
                        <p className="text-xs font-bold font-montserrat text-[#2B170F]">
                          {project.deliverables}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Metrics Impact Banner */}
                  {project.metrics && (
                    <div className="p-4 rounded-2xl bg-[#F8F1E7] border-l-4 border-[#C65D45]">
                      <span className="text-[10px] font-montserrat uppercase font-semibold tracking-wider text-[#C65D45] block mb-1">
                        Campaign Impact & Results
                      </span>
                      <p className="text-sm font-bold font-montserrat text-[#2B170F]">
                        {project.metrics}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Interactive Before/After Comparison or Video Showcase */}
                <div className="lg:col-span-6 space-y-6">
                  {project.before_image_url && project.after_image_url ? (
                    <BeforeAfterSlider
                      beforeImage={project.before_image_url}
                      afterImage={project.after_image_url}
                      title="Raw S-Log3 vs Final Color Master"
                    />
                  ) : (
                    <div
                      onClick={() => onOpenLightbox(project.video_url, project.title, project.client, project.category)}
                      className="relative w-full aspect-16-9 rounded-2xl overflow-hidden cursor-pointer bg-black border border-[#2B170F]/10 group/img shadow-xl"
                    >
                      <img
                        src={project.thumbnail_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover/img:scale-110 group-hover/img:bg-[#C65D45] group-hover/img:text-[#2B170F] transition-all duration-300">
                          <Play className="w-7 h-7 fill-current ml-1" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video Play Trigger Card */}
                  <div
                    onClick={() => onOpenLightbox(project.video_url, project.title, project.client, project.category)}
                    className="p-4 rounded-2xl bg-[#F8F1E7] hover:bg-[#ece4da] border border-[#2B170F]/10 cursor-pointer transition-all flex items-center justify-between group/play shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#C65D45]/20 flex items-center justify-center text-[#2B170F] group-hover/play:scale-110 group-hover/play:bg-[#C65D45] transition-all">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold font-montserrat text-[#2B170F] group-hover/play:text-[#C65D45] transition-colors">
                          Watch High-Definition Master
                        </div>
                        <div className="text-[11px] font-montserrat text-[#756A62]">4K Master Audio & Rec.709 Color</div>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#756A62] group-hover/play:text-[#2B170F] group-hover/play:translate-x-0.5 group-hover/play:-translate-y-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
