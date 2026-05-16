import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Github, ExternalLink } from 'lucide-react';
import { LOGO_ICON } from '../constants/assets';
import { ABOUT } from '../content/about';

function AboutModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const { developer } = ABOUT;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <div
        className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto bg-onyx-dark/95 backdrop-blur-md border border-onyx-border/80 shadow-2xl p-6 sm:p-8 mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-onyx-muted hover:text-white p-1"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <img
            src={LOGO_ICON}
            alt=""
            className="h-16 w-16 rounded-full object-cover border-2 border-white/20 shadow-lg mb-4"
          />
          <h2 id="about-title" className="text-2xl font-bold text-white tracking-tight">
            {ABOUT.title}
          </h2>
          <p className="text-sm text-onyx-muted mt-1">{ABOUT.subtitle}</p>
        </div>

        <div className="space-y-4 text-sm text-onyx-text leading-relaxed text-center sm:text-left">
          {ABOUT.paragraphs.map((text) => (
            <p key={text.slice(0, 24)}>{text}</p>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-onyx-border/80">
          <p className="text-xs text-onyx-muted uppercase tracking-wider text-center mb-3">
            Acerca del desarrollador
          </p>

          <div className="text-center mb-4">
            <p className="text-lg font-semibold text-white">{developer.name}</p>
            <p className="text-sm text-onyx-muted mt-0.5">
              {developer.alias} · {developer.role}
            </p>
            {developer.location && (
              <p className="text-xs text-onyx-muted mt-1">{developer.location}</p>
            )}
          </div>

          <p className="text-sm text-onyx-text leading-relaxed text-center sm:text-left mb-4">
            {developer.bio}
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {ABOUT.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-onyx-border text-onyx-muted hover:text-white hover:border-white/30 hover:bg-onyx-panel/60 transition-colors"
              >
                {link.label === 'GitHub' ? (
                  <Github className="w-3.5 h-3.5" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5" />
                )}
                {link.label}
              </a>
            ))}
          </div>

          <p className="text-xs text-onyx-muted text-center mt-4">v{ABOUT.version}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default AboutModal;
