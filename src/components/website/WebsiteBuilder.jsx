import { useEffect, useMemo, useState } from 'react';
import {
  BookHeart,
  Check,
  Copy,
  Eye,
  Gift,
  Globe,
  Hotel,
  ImagePlus,
  Images,
  MailCheck,
  Monitor,
  Palette,
  Pencil,
  Plus,
  Save,
  Send,
  Smartphone,
  Sparkles,
  Trash2,
  Type,
} from 'lucide-react';
import { Badge, Button, Card, Input, Modal, useToast } from '../ui';
import { useWedding } from '../../contexts/WeddingContext';
import { subscribeToEvents } from '../../services/eventService';
import { saveWebsiteConfig } from '../../services/websiteService';
import WeddingWebsitePreview from './WeddingWebsitePreview';
import ThemeThumbnail from './ThemeThumbnail';
import {
  WEBSITE_THEMES,
  getGroupedThemes,
  getExamplesForTheme,
  getPreviewConfigForTheme,
  buildConfigFromExample,
  getCoupleDisplayName,
  getPublicWeddingWebsiteLink,
  normalizeWebsiteConfig,
  sanitizeWebsiteConfig,
} from './websiteThemes';

const websiteThemes = Object.values(WEBSITE_THEMES);
const themeGroups = getGroupedThemes();

function Toggle({ checked, onChange, label, disabled = false, helperText }) {
  return (
    <label className={`flex items-start justify-between gap-4 rounded-2xl border border-gray-200 px-4 py-3 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500 focus-visible:ring-offset-2 ${checked ? 'bg-wine-700' : 'bg-gray-300'}`}
        disabled={disabled}
        aria-pressed={checked}
        aria-label={label}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${checked ? 'left-6' : 'left-1'}`}
        />
      </button>
    </label>
  );
}

function formatEventSummary(event) {
  const dateLabel = event?.date
    ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Date TBD';
  const timeLabel = [event?.startTime, event?.endTime].filter(Boolean).join(' - ');
  return [dateLabel, timeLabel].filter(Boolean).join(' • ');
}

function updateArrayItem(items, index, field, value) {
  return items.map((item, itemIndex) => (
    itemIndex === index ? { ...item, [field]: value } : item
  ));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read image file'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Unable to load image'));
      image.onload = () => {
        const maxWidth = 1600;
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Unable to process image'));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const textareaClass = 'block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors hover:border-gray-400 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-600/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500';

export default function WebsiteBuilder() {
  const { activeWedding, canEdit, isViewer } = useWedding();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [activeSection, setActiveSection] = useState('theme');
  const [config, setConfig] = useState(() => normalizeWebsiteConfig());
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [showCustomColors, setShowCustomColors] = useState(false);
  const [chooserTheme, setChooserTheme] = useState(null);

  // While the site is published (live for guests), the whole builder is locked.
  // Editors must unpublish to make changes, then republish — this prevents a
  // live page from being changed into a half-edited state.
  const editingLocked = !canEdit || config.websitePublished;

  useEffect(() => {
    if (!activeWedding) return undefined;
    return subscribeToEvents(activeWedding.id, setEvents);
  }, [activeWedding]);

  useEffect(() => {
    if (!activeWedding) return;
    setConfig(normalizeWebsiteConfig(activeWedding, events.map((event) => event.id)));
  }, [activeWedding, events]);

  const websiteUrl = activeWedding ? getPublicWeddingWebsiteLink(activeWedding.id, activeWedding.slug) : '';
  const selectedEventIds = new Set(config.websiteEventIds || []);
  const coupleDisplayName = getCoupleDisplayName(activeWedding);
  const activeTheme = WEBSITE_THEMES[config.websiteTheme] || websiteThemes[0];

  const selectedEventsCount = events.filter((event) => selectedEventIds.has(event.id)).length;
  const hasCustomColor = Boolean(
    config.websiteCustomColors?.primary || config.websiteCustomColors?.accent || config.websiteCustomColors?.background,
  );

  const sections = useMemo(() => ([
    {
      key: 'theme',
      label: 'Theme & Colors',
      icon: Palette,
      summary: activeTheme.name,
      tone: 'always',
    },
    {
      key: 'hero',
      label: 'Hero',
      icon: Sparkles,
      summary: config.websiteHero.date ? 'Date set' : 'Add a date',
      tone: 'always',
    },
    {
      key: 'events',
      label: 'Events',
      icon: Globe,
      summary: `${selectedEventsCount} visible`,
      tone: 'always',
    },
    {
      key: 'story',
      label: 'Our Story',
      icon: BookHeart,
      summary: config.websiteStory.text ? 'Written' : 'Optional',
      tone: 'toggle',
      enabled: config.websiteStory.enabled,
    },
    {
      key: 'gallery',
      label: 'Gallery',
      icon: Images,
      summary: `${config.websiteGallery.images.length}/12 photos`,
      tone: 'toggle',
      enabled: config.websiteGallery.enabled,
    },
    {
      key: 'travel',
      label: 'Travel',
      icon: Hotel,
      summary: `${config.websiteHotels.items.length} hotel${config.websiteHotels.items.length === 1 ? '' : 's'}`,
      tone: 'toggle',
      enabled: config.websiteHotels.enabled,
    },
    {
      key: 'registry',
      label: 'Registry',
      icon: Gift,
      summary: `${config.websiteRegistry.items.length} link${config.websiteRegistry.items.length === 1 ? '' : 's'}`,
      tone: 'toggle',
      enabled: config.websiteRegistry.enabled,
    },
    {
      key: 'rsvp',
      label: 'RSVP',
      icon: MailCheck,
      summary: config.websiteRsvp.buttonText || 'RSVP Now',
      tone: 'toggle',
      enabled: config.websiteRsvp.enabled,
    },
    {
      key: 'footer',
      label: 'Footer',
      icon: Type,
      summary: config.websiteFooter ? 'Custom' : 'Default',
      tone: 'always',
    },
  ]), [
    activeTheme.name,
    config.websiteHero.date,
    config.websiteStory.enabled,
    config.websiteStory.text,
    config.websiteGallery.enabled,
    config.websiteGallery.images.length,
    config.websiteHotels.enabled,
    config.websiteHotels.items.length,
    config.websiteRegistry.enabled,
    config.websiteRegistry.items.length,
    config.websiteRsvp.enabled,
    config.websiteRsvp.buttonText,
    config.websiteFooter,
    selectedEventsCount,
  ]);

  if (!activeWedding) return null;

  const setHeroValue = (field, value) => {
    setConfig((current) => ({
      ...current,
      websiteHero: { ...current.websiteHero, [field]: value },
    }));
  };

  const updateSection = (field, value) => {
    setConfig((current) => ({ ...current, [field]: value }));
  };

  const handleEventToggle = (eventId) => {
    setConfig((current) => {
      const existing = new Set(current.websiteEventIds || []);
      if (existing.has(eventId)) existing.delete(eventId);
      else existing.add(eventId);
      return { ...current, websiteEventIds: Array.from(existing) };
    });
  };

  const handleAddHotel = () => {
    updateSection('websiteHotels', {
      ...config.websiteHotels,
      items: [...config.websiteHotels.items, { name: '', address: '', link: '', groupRateCode: '' }],
    });
  };

  const handleAddRegistry = () => {
    updateSection('websiteRegistry', {
      ...config.websiteRegistry,
      items: [...config.websiteRegistry.items, { name: '', url: '' }],
    });
  };

  const handleUseExample = (example) => {
    if (!canEdit || editingLocked) return;
    setConfig((current) => buildConfigFromExample(example, current));
    toast.success(`${example.name} example applied. Personalize the details below.`);
  };

  const handleRemoveGalleryImage = (index) => {
    updateSection('websiteGallery', {
      ...config.websiteGallery,
      images: config.websiteGallery.images.filter((_, imageIndex) => imageIndex !== index),
    });
  };

  const handleCustomColorChange = (field, value) => {
    updateSection('websiteCustomColors', {
      ...config.websiteCustomColors,
      [field]: value,
    });
  };

  const handleSave = async (published = config.websitePublished) => {
    const wasPublishToggle = published !== config.websitePublished;
    // A live (published) site can only be changed by first unpublishing.
    // Publish/unpublish toggles are always allowed; plain saves while published
    // are blocked so guests never see a half-edited page.
    if (!wasPublishToggle && config.websitePublished) {
      toast.error('Unpublish your website before saving changes so live guests don\'t see a half-finished page.');
      return;
    }
    setSaving(true);
    try {
      const nextConfig = sanitizeWebsiteConfig({ ...config, websitePublished: published });
      await saveWebsiteConfig(activeWedding.id, nextConfig);
      setConfig(nextConfig);
      if (wasPublishToggle) {
        toast.success(published ? 'Website published. It\'s live for guests.' : 'Website unpublished.');
      } else {
        toast.success('Website saved.');
      }
    } catch (error) {
      console.error('Failed to save website:', error);
      toast.error('Could not save your website. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard?.writeText(websiteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (insecure context / older browser) — ignore.
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingHero(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setHeroValue('backgroundImage', dataUrl);
    } finally {
      setUploadingHero(false);
      event.target.value = '';
    }
  };

  const handleGalleryUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploadingGallery(true);
    try {
      const remainingSlots = Math.max(0, 12 - config.websiteGallery.images.length);
      if (remainingSlots === 0) return;

      const uploadedImages = await Promise.all(files.slice(0, remainingSlots).map((file) => fileToDataUrl(file)));
      setConfig((current) => ({
        ...current,
        websiteGallery: {
          ...current.websiteGallery,
          images: [...current.websiteGallery.images, ...uploadedImages].slice(0, 12),
        },
      }));
    } finally {
      setUploadingGallery(false);
      event.target.value = '';
    }
  };

  const renderSectionEditor = () => {
    switch (activeSection) {
      case 'theme':
        return (
          <div className="space-y-6">
            <p className="text-center text-sm text-gray-500">
              Each template previews the real first page. Click one to start from scratch or pick a ready-made example.
            </p>
            {themeGroups.map((group) => (
              <div key={group.key} className="space-y-3">
                <div>
                  <p className="text-base font-semibold text-gray-900">{group.name}</p>
                  {group.description && <p className="text-sm text-gray-500">{group.description}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {group.themeList.map((theme) => {
                    const selected = config.websiteTheme === theme.key;
                    const exampleCount = getExamplesForTheme(theme.key).length;
                    return (
                      <button
                        key={theme.key}
                        type="button"
                        disabled={editingLocked}
                        onClick={() => canEdit && setChooserTheme(theme)}
                        className={`group overflow-hidden rounded-3xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500 focus-visible:ring-offset-2 ${
                          selected ? 'border-wine-600 ring-2 ring-wine-100' : 'border-gray-200 hover:border-gray-300'
                        } ${canEdit ? '' : 'cursor-default'}`}
                      >
                        <div className="relative">
                          <ThemeThumbnail
                            wedding={activeWedding}
                            config={getPreviewConfigForTheme(theme.key, config)}
                          />
                          {selected && (
                            <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-wine-600 text-white shadow-md">
                              <Check size={16} />
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-base font-semibold text-gray-900">{theme.name}</p>
                          <p className="mt-1 text-sm text-gray-600">{theme.description}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-700">
                              {theme.layout} layout
                            </span>
                            {exampleCount > 0 && (
                              <span className="rounded-full bg-wine-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-wine-700">
                                {exampleCount} example{exampleCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <Modal
              open={Boolean(chooserTheme)}
              onClose={() => setChooserTheme(null)}
              title={chooserTheme ? chooserTheme.name : ''}
              size="xl"
            >
              {chooserTheme && (
                <div className="space-y-6">
                  <div>
                    <ThemeThumbnail
                      wedding={activeWedding}
                      config={getPreviewConfigForTheme(chooserTheme.key, config)}
                      aspect="16 / 9"
                    />
                    <p className="mt-3 text-sm text-gray-600">{chooserTheme.description}</p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Start from scratch</p>
                      <p className="text-sm text-gray-500">Use this style with your own photos and words.</p>
                    </div>
                    <Button
                      type="button"
                      className="mt-3 w-full sm:mt-0 sm:w-auto"
                      disabled={editingLocked}
                      onClick={() => {
                        updateSection('websiteTheme', chooserTheme.key);
                        toast.success(`${chooserTheme.name} selected. Add your photos and words below.`);
                        setChooserTheme(null);
                      }}
                    >
                      Use this template
                    </Button>
                  </div>

                  {getExamplesForTheme(chooserTheme.key).length > 0 && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Or start from an example</p>
                        <p className="text-sm text-gray-500">A finished site you can import, then swap in your own details.</p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {getExamplesForTheme(chooserTheme.key).map((example) => {
                          const exampleConfig = buildConfigFromExample(example, config);
                          return (
                            <div
                              key={example.key}
                              className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                            >
                              <ThemeThumbnail wedding={activeWedding} config={exampleConfig} />
                              <div className="p-3">
                                <p className="text-sm font-semibold text-gray-900">{example.name}</p>
                                <p className="mt-0.5 text-sm text-gray-600">{example.tagline}</p>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="mt-3 w-full"
                                  disabled={editingLocked}
                                  onClick={() => {
                                    handleUseExample(example);
                                    setChooserTheme(null);
                                  }}
                                >
                                  Use this example
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Modal>

            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
              <button
                type="button"
                onClick={() => setShowCustomColors((current) => !current)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-wine-700 shadow-sm">
                    <Palette size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Customize Colors</p>
                    <p className="text-xs text-gray-500">Override the selected theme with your own brand colors.</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-wine-700">{showCustomColors ? 'Hide' : 'Show'}</span>
              </button>

              {showCustomColors && (
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {[
                    { key: 'primary', label: 'Primary Color', fallback: activeTheme.primary },
                    { key: 'accent', label: 'Accent Color', fallback: activeTheme.accent },
                    { key: 'background', label: 'Background Color', fallback: activeTheme.background },
                  ].map((colorField) => (
                    <div key={colorField.key} className="rounded-2xl border border-gray-200 bg-white p-4">
                      <label className="mb-2 block text-sm font-medium text-gray-700">{colorField.label}</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={config.websiteCustomColors?.[colorField.key] || colorField.fallback}
                          disabled={editingLocked}
                          onChange={(event) => handleCustomColorChange(colorField.key, event.target.value)}
                          className="h-11 w-14 rounded-lg border border-gray-300 bg-white p-1 disabled:bg-gray-50"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {(config.websiteCustomColors?.[colorField.key] || colorField.fallback).toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {config.websiteCustomColors?.[colorField.key] ? 'Custom override applied' : `Using ${activeTheme.name} default`}
                          </p>
                        </div>
                      </div>
                      {config.websiteCustomColors?.[colorField.key] && canEdit && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={() => handleCustomColorChange(colorField.key, '')}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'hero':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Couple Names" value={coupleDisplayName} disabled />
            <Input
              label="Wedding Date"
              type="date"
              value={config.websiteHero.date}
              onChange={(event) => setHeroValue('date', event.target.value)}
              disabled={editingLocked}
            />
            <div className="md:col-span-2">
              <label htmlFor="website-hero-tagline" className="mb-1 block text-sm font-medium text-gray-700">Tagline or Quote</label>
              <textarea
                id="website-hero-tagline"
                value={config.websiteHero.tagline}
                onChange={(event) => setHeroValue('tagline', event.target.value)}
                rows={3}
                disabled={editingLocked}
                placeholder="A joyful weekend of love, laughter, and forever."
                className={textareaClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">Hero Background Image</label>
              <div className="flex flex-wrap items-center gap-3">
                <label className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium ${canEdit ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default bg-gray-50 text-gray-500'}`}>
                  <input type="file" accept="image/*" className="hidden" disabled={editingLocked} onChange={handleImageUpload} />
                  <ImagePlus size={16} />
                  {uploadingHero ? 'Uploading...' : config.websiteHero.backgroundImage ? 'Replace Image' : 'Upload Image'}
                </label>
                {config.websiteHero.backgroundImage && canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setHeroValue('backgroundImage', '')}
                  >
                    Remove Image
                  </Button>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Images are optimized before saving so your page loads quickly for guests.
              </p>
            </div>
          </div>
        );

      case 'events':
        return (
          <div>
            <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-wine-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-wine-950">{selectedEventsCount} event{selectedEventsCount === 1 ? '' : 's'} visible</p>
                <p className="text-xs text-wine-800">Select the celebrations guests should see on the public website.</p>
              </div>
              <Globe className="text-wine-600" size={20} />
            </div>

            <div className="space-y-3">
              {events.length === 0 && (
                <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                  Add events in the Events page to feature them on your website.
                </p>
              )}
              {events.map((event) => {
                const checked = selectedEventIds.has(event.id);
                return (
                  <label
                    key={event.id}
                    className={`flex items-start gap-4 rounded-2xl border px-4 py-4 ${checked ? 'border-wine-200 bg-wine-50' : 'border-gray-200'} ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-wine-700 focus:ring-wine-600"
                      checked={checked}
                      onChange={() => handleEventToggle(event.id)}
                      disabled={editingLocked}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{event.name}</p>
                        {event.dressCode && <Badge variant="rose">{event.dressCode}</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{formatEventSummary(event)}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {[event.venue, event.address].filter(Boolean).join(' • ') || 'Venue details to come'}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 'story':
        return (
          <div className="space-y-4">
            <Toggle
              checked={config.websiteStory.enabled}
              onChange={(enabled) => updateSection('websiteStory', { ...config.websiteStory, enabled })}
              disabled={editingLocked}
              label="Show our story"
              helperText="Share how you met, the proposal, or what this celebration means to you."
            />
            <textarea
              value={config.websiteStory.text}
              onChange={(event) => updateSection('websiteStory', { ...config.websiteStory, text: event.target.value })}
              rows={6}
              disabled={editingLocked}
              placeholder="Tell your story here..."
              className={textareaClass}
            />
          </div>
        );

      case 'gallery':
        return (
          <div className="space-y-4">
            <Toggle
              checked={config.websiteGallery.enabled}
              onChange={(enabled) => updateSection('websiteGallery', { ...config.websiteGallery, enabled })}
              disabled={editingLocked}
              label="Show photo gallery"
              helperText="Upload up to 12 favorite photos to create a beautiful memory wall for guests."
            />
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-gray-300 px-4 py-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {config.websiteGallery.images.length} of 12 images uploaded
                </p>
                <p className="text-xs text-gray-500">Images are saved as optimized base64 files, just like the hero image.</p>
              </div>
              <label className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium ${canEdit && config.websiteGallery.images.length < 12 ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default bg-gray-50 text-gray-500'}`}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={editingLocked || config.websiteGallery.images.length >= 12}
                  onChange={handleGalleryUpload}
                />
                <ImagePlus size={16} />
                {uploadingGallery ? 'Uploading...' : config.websiteGallery.images.length >= 12 ? 'Gallery Full' : 'Upload Images'}
              </label>
            </div>
            {config.websiteGallery.images.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                Add photos from your engagement shoot, travels, or favorite memories together.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {config.websiteGallery.images.map((image, index) => (
                  <div key={`gallery-${index}`} className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                    <img src={image} alt={`Gallery upload ${index + 1}`} className="aspect-square h-full w-full object-cover" />
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(index)}
                        className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-red-600 shadow-sm transition hover:bg-white"
                        aria-label={`Remove gallery image ${index + 1}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'travel':
        return (
          <div className="space-y-4">
            <Toggle
              checked={config.websiteHotels.enabled}
              onChange={(enabled) => updateSection('websiteHotels', { ...config.websiteHotels, enabled })}
              disabled={editingLocked}
              label="Show hotels and travel details"
              helperText="Recommend hotel blocks, nearby stays, and booking links."
            />
            {config.websiteHotels.items.length === 0 && (
              <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500">
                Add one or more hotel blocks to help guests plan their stay.
              </p>
            )}
            {config.websiteHotels.items.map((hotel, index) => (
              <div key={`hotel-${index}`} className="rounded-2xl border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Hotel {index + 1}</p>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => updateSection('websiteHotels', {
                        ...config.websiteHotels,
                        items: config.websiteHotels.items.filter((_, itemIndex) => itemIndex !== index),
                      })}
                      className="text-sm text-red-600 hover:text-red-700"
                      aria-label={`Remove hotel ${index + 1}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Hotel Name"
                    value={hotel.name}
                    onChange={(event) => updateSection('websiteHotels', {
                      ...config.websiteHotels,
                      items: updateArrayItem(config.websiteHotels.items, index, 'name', event.target.value),
                    })}
                    disabled={editingLocked}
                  />
                  <Input
                    label="Group Rate Code"
                    value={hotel.groupRateCode}
                    onChange={(event) => updateSection('websiteHotels', {
                      ...config.websiteHotels,
                      items: updateArrayItem(config.websiteHotels.items, index, 'groupRateCode', event.target.value),
                    })}
                    disabled={editingLocked}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Address"
                      value={hotel.address}
                      onChange={(event) => updateSection('websiteHotels', {
                        ...config.websiteHotels,
                        items: updateArrayItem(config.websiteHotels.items, index, 'address', event.target.value),
                      })}
                      disabled={editingLocked}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Booking Link"
                      value={hotel.link}
                      onChange={(event) => updateSection('websiteHotels', {
                        ...config.websiteHotels,
                        items: updateArrayItem(config.websiteHotels.items, index, 'link', event.target.value),
                      })}
                      disabled={editingLocked}
                      placeholder="https://"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'registry':
        return (
          <div className="space-y-4">
            <Toggle
              checked={config.websiteRegistry.enabled}
              onChange={(enabled) => updateSection('websiteRegistry', { ...config.websiteRegistry, enabled })}
              disabled={editingLocked}
              label="Show registry links"
              helperText="Add any external registries or gifting pages you'd like guests to visit."
            />
            {config.websiteRegistry.items.length === 0 && (
              <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500">
                Add a store name and URL for each registry.
              </p>
            )}
            {config.websiteRegistry.items.map((registry, index) => (
              <div key={`registry-${index}`} className="rounded-2xl border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Registry {index + 1}</p>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => updateSection('websiteRegistry', {
                        ...config.websiteRegistry,
                        items: config.websiteRegistry.items.filter((_, itemIndex) => itemIndex !== index),
                      })}
                      className="text-sm text-red-600 hover:text-red-700"
                      aria-label={`Remove registry ${index + 1}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Store Name"
                    value={registry.name}
                    onChange={(event) => updateSection('websiteRegistry', {
                      ...config.websiteRegistry,
                      items: updateArrayItem(config.websiteRegistry.items, index, 'name', event.target.value),
                    })}
                    disabled={editingLocked}
                  />
                  <Input
                    label="URL"
                    value={registry.url}
                    onChange={(event) => updateSection('websiteRegistry', {
                      ...config.websiteRegistry,
                      items: updateArrayItem(config.websiteRegistry.items, index, 'url', event.target.value),
                    })}
                    disabled={editingLocked}
                    placeholder="https://"
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case 'rsvp':
        return (
          <div className="space-y-4">
            <Toggle
              checked={config.websiteRsvp.enabled}
              onChange={(enabled) => updateSection('websiteRsvp', { ...config.websiteRsvp, enabled })}
              disabled={editingLocked}
              label="Show RSVP button"
              helperText="Display a clear RSVP call-to-action on the public website."
            />
            <Input
              label="Button Text"
              value={config.websiteRsvp.buttonText}
              onChange={(event) => updateSection('websiteRsvp', { ...config.websiteRsvp, buttonText: event.target.value })}
              disabled={editingLocked}
              placeholder="RSVP Now"
            />
          </div>
        );

      case 'footer':
        return (
          <div className="space-y-2">
            <label htmlFor="website-footer" className="block text-sm font-medium text-gray-700">Footer Message</label>
            <textarea
              id="website-footer"
              value={config.websiteFooter}
              onChange={(event) => updateSection('websiteFooter', event.target.value)}
              rows={3}
              disabled={editingLocked}
              placeholder="We can't wait to celebrate with you!"
              className={textareaClass}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const activeMeta = sections.find((section) => section.key === activeSection) || sections[0];

  const previewPane = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
          <p className="text-sm text-gray-500">Exactly what guests will see.</p>
        </div>
        <div className="inline-flex items-center rounded-xl border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setPreviewDevice('desktop')}
            aria-pressed={previewDevice === 'desktop'}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500 ${previewDevice === 'desktop' ? 'bg-wine-700 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Monitor size={15} />
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setPreviewDevice('mobile')}
            aria-pressed={previewDevice === 'mobile'}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500 ${previewDevice === 'mobile' ? 'bg-wine-700 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Smartphone size={15} />
            Mobile
          </button>
        </div>
      </div>
      <div className={`rounded-3xl bg-gray-100/70 p-3 ${previewDevice === 'mobile' ? 'flex justify-center' : ''}`}>
        <div className={previewDevice === 'mobile' ? 'w-full max-w-[390px]' : 'w-full'}>
          <WeddingWebsitePreview
            wedding={activeWedding}
            config={config}
            events={events}
            previewMode
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-30 -mx-4 border-b border-gray-100 bg-white/85 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/70 sm:mx-0 sm:rounded-2xl sm:border sm:px-5 sm:shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={config.websitePublished ? 'success' : 'warning'}>
              {config.websitePublished ? 'Published' : 'Draft'}
            </Badge>
            {isViewer && <Badge variant="info">Read-only</Badge>}
            <div className="hidden items-center gap-2 text-sm text-gray-500 md:flex">
              <Globe size={15} className="text-gray-400" />
              <span className="max-w-[22rem] truncate font-medium text-gray-700">{websiteUrl}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
            <div className="inline-flex shrink-0 items-center rounded-xl border border-gray-200 bg-white p-1 xl:hidden">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                aria-pressed={!previewMode}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${!previewMode ? 'bg-wine-700 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Pencil size={14} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                aria-pressed={previewMode}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${previewMode ? 'bg-wine-700 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Eye size={14} />
                Preview
              </button>
            </div>
            <Button size="sm" variant="outline" className="shrink-0" onClick={handleCopyLink}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy Link'}
            </Button>
            {canEdit && (
              <>
                <Button size="sm" variant="outline" className="shrink-0" onClick={() => handleSave()} disabled={saving || config.websitePublished} title={config.websitePublished ? 'Unpublish to edit your website' : undefined}>
                  <Save size={14} />
                  {config.websitePublished ? 'Save Changes' : 'Save Draft'}
                </Button>
                <Button size="sm" className="shrink-0" onClick={() => handleSave(!config.websitePublished)} disabled={saving}>
                  <Send size={14} />
                  {config.websitePublished ? 'Unpublish' : 'Publish'}
                </Button>
                {config.websitePublished && (
                  <p className="w-full text-right text-xs text-amber-700">Your site is live — unpublish to edit, then republish.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className={previewMode ? 'hidden xl:block' : 'block'}>
          <nav aria-label="Website sections" className="mb-5 flex flex-wrap gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = section.key === activeSection;
              const isHidden = section.tone === 'toggle' && !section.enabled;
              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActiveSection(section.key)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`group inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500 focus-visible:ring-offset-2 ${
                    isActive
                      ? 'border-wine-600 bg-wine-700 text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  <Icon size={15} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
                  {section.label}
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isHidden
                        ? (isActive ? 'bg-white/40' : 'bg-gray-300')
                        : (isActive ? 'bg-white' : 'bg-emerald-500')
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </nav>

          <Card
            title={activeMeta.label}
            actions={(
              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-gray-500 sm:inline">{activeMeta.summary}</span>
                {activeSection === 'travel' && canEdit && (
                  <Button size="sm" variant="outline" onClick={handleAddHotel}>
                    <Plus size={14} />
                    Add Hotel
                  </Button>
                )}
                {activeSection === 'registry' && canEdit && (
                  <Button size="sm" variant="outline" onClick={handleAddRegistry}>
                    <Plus size={14} />
                    Add Registry
                  </Button>
                )}
              </div>
            )}
          >
            {renderSectionEditor()}
          </Card>
        </div>

        <div className={`${previewMode ? 'block' : 'hidden xl:block'} xl:sticky xl:top-24 xl:self-start`}>
          {previewPane}
        </div>
      </div>
    </div>
  );
}
