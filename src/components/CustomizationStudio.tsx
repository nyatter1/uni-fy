import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Type, 
  Palette, 
  Music, 
  Sparkles, 
  Layout, 
  Square, 
  Save, 
  X,
  Plus,
  Minus,
  Check,
  ChevronRight,
  Zap,
  ArrowUp,
  Repeat,
  MessageCircle,
  CheckCheck
} from 'lucide-react';
import { CustomizationOptions, DEFAULT_CUSTOMIZATION, getProfileStyles, getUsernameStyles, getGlobalStyles } from '../types/customization';
import { supabase } from '../supabase';

interface CustomizationStudioProps {
  id: string;
  customization: CustomizationOptions;
  onClose: () => void;
  onUpdate: (newCustomization: CustomizationOptions) => void;
}

const FONTS = [
  'Inter', 'Space Grotesk', 'Outfit', 'Playfair Display', 'JetBrains Mono', 
  'Cormorant Garamond', 'Libre Baskerville', 'Anton', 'Montserrat', 'Georgia',
  'Courier New', 'Helvetica Neue', 'Roboto Mono', 'Bebas Neue', 'Pacifico',
  'Dancing Script', 'Oswald', 'Raleway', 'Merriweather', 'Lora', 'Quicksand',
  'Kanit', 'Josefin Sans', 'Abel', 'Permanent Marker', 'Righteous', 'Fredoka One',
  'Cinzel', 'Exo 2', 'Orbitron', 'Press Start 2P', 'Silkscreen', 'Unbounded'
];

const ANIMATIONS = [
  'none', 'rainbow', 'shimmer', 'pulse', 'wave', 'glitch', 'neon-flicker', 
  'float', 'bounce', 'spin-slow', 'color-cycle', 'text-reveal'
];
const BG_TYPES = ['color', 'gradient', 'image', 'animated'];
const BORDER_STYLES = ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'];
const EFFECTS = ['none', 'confetti', 'snow', 'fireworks', 'glitch'];

export const CustomizationStudio: React.FC<CustomizationStudioProps> = ({ 
  id, 
  customization, 
  onClose, 
  onUpdate 
}) => {
  const [localCustom, setLocalCustom] = useState<CustomizationOptions>(customization || DEFAULT_CUSTOMIZATION);
  const [activeTab, setActiveTab] = useState<'typography' | 'username' | 'profile' | 'effects'>('typography');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await supabase.from('users').update({
        customization: localCustom
      }).eq('id', id);
      onUpdate(localCustom);
      onClose();
    } catch (err) {
      console.error("Error saving customization:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof CustomizationOptions, value: any) => {
    setLocalCustom(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent: keyof CustomizationOptions, field: string, value: any) => {
    setLocalCustom(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value
      }
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
    >
      <div className="w-full max-w-6xl h-[85vh] bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-purple-500/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Nitro Studio</h2>
              <p className="text-xs text-white/50">Customise every pixel of your vibe</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="text-white/70 w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-white/10 p-4 flex flex-col gap-2 bg-black/20">
            <TabButton 
              active={activeTab === 'typography'} 
              onClick={() => setActiveTab('typography')}
              icon={<Type size={18} />}
              label="Typography"
            />
            <TabButton 
              active={activeTab === 'username'} 
              onClick={() => setActiveTab('username')}
              icon={<Palette size={18} />}
              label="Username"
            />
            <TabButton 
              active={activeTab === 'profile'} 
              onClick={() => setActiveTab('profile')}
              icon={<Layout size={18} />}
              label="Profile Style"
            />
            <TabButton 
              active={activeTab === 'effects'} 
              onClick={() => setActiveTab('effects')}
              icon={<Sparkles size={18} />}
              label="Effects & Music"
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {activeTab === 'typography' && (
              <div className="space-y-8">
                <Section title="Personal Font" description="Choose a unique font for your messages and profile card">
                  <div className="grid grid-cols-2 gap-3">
                    {FONTS.map(font => (
                      <FontCard 
                        key={font}
                        font={font}
                        active={localCustom.profileFont === font}
                        onClick={() => updateField('profileFont', font)}
                      />
                    ))}
                  </div>
                </Section>

                <Section title="Font Scale" description="Adjust the overall size of text elements (Global)">
                  <div className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <button 
                      onClick={() => updateField('fontScale', Math.max(0.8, (localCustom.fontScale || 1) - 0.1))}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-xl font-mono font-bold text-indigo-400">
                      {Math.round((localCustom.fontScale || 1) * 100)}%
                    </span>
                    <button 
                      onClick={() => updateField('fontScale', Math.min(1.5, (localCustom.fontScale || 1) + 0.1))}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </Section>
              </div>
            )}

            {activeTab === 'username' && (
              <div className="space-y-8">
                <Section title="Username Color" description="Pick a solid color for your display name">
                  <div className="flex flex-wrap gap-3">
                    {['#ffffff', '#ff4e00', '#00ff00', '#00ffff', '#ff00ff', '#ffff00', '#ff0000', '#4f46e5', '#fbbf24', '#ec4899', '#8b5cf6', '#10b981'].map(color => (
                      <button 
                        key={color}
                        onClick={() => updateField('usernameColor', color)}
                        className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${localCustom.usernameColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input 
                      type="color" 
                      value={localCustom.usernameColor}
                      onChange={(e) => updateField('usernameColor', e.target.value)}
                      className="w-10 h-10 rounded-full bg-transparent border-none cursor-pointer"
                    />
                  </div>
                </Section>

                <Section title="Glow Color" description="Customise the color of your name's glow">
                  <div className="flex flex-wrap gap-3">
                    {['#ffffff', '#ff4e00', '#00ff00', '#00ffff', '#ff00ff', '#ffff00', '#ff0000', '#4f46e5'].map(color => (
                      <button 
                        key={color}
                        onClick={() => updateNestedField('usernameGlow', 'color', color)}
                        className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${localCustom.usernameGlow?.color === color ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input 
                      type="color" 
                      value={localCustom.usernameGlow?.color || '#ffffff'}
                      onChange={(e) => updateNestedField('usernameGlow', 'color', e.target.value)}
                      className="w-10 h-10 rounded-full bg-transparent border-none cursor-pointer"
                    />
                  </div>
                </Section>

                <Section title="Animations" description="Add some dynamic energy to your name">
                  <div className="grid grid-cols-3 gap-3">
                    {ANIMATIONS.map(anim => (
                      <button 
                        key={anim}
                        onClick={() => updateField('usernameAnimation', anim)}
                        className={`p-3 rounded-xl border transition-all text-sm capitalize ${localCustom.usernameAnimation === anim ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}
                      >
                        {anim}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Glow Intensity" description="Make your name pop with a subtle glow">
                  <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    value={localCustom.usernameGlow?.intensity || 0}
                    onChange={(e) => updateNestedField('usernameGlow', 'intensity', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-white/30 mt-2 uppercase tracking-widest">
                    <span>None</span>
                    <span>Extreme</span>
                  </div>
                </Section>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-8">
                <Section title="Background Type" description="Choose how your profile background looks">
                  <div className="grid grid-cols-4 gap-3">
                    {BG_TYPES.map(type => (
                      <button 
                        key={type}
                        onClick={() => updateField('profileBgType', type)}
                        className={`p-3 rounded-xl border transition-all text-sm capitalize ${localCustom.profileBgType === type ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Border Style" description="Frame your profile with a unique border">
                  <div className="grid grid-cols-3 gap-3">
                    {BORDER_STYLES.map(style => (
                      <button 
                        key={style}
                        onClick={() => updateField('profileBorderStyle', style)}
                        className={`p-3 rounded-xl border transition-all text-sm capitalize ${localCustom.profileBorderStyle === style ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Border Width" description="Thickness of your profile border">
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={localCustom.profileBorderWidth || 0}
                    onChange={(e) => updateField('profileBorderWidth', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-white/30 mt-2 uppercase tracking-widest">
                    <span>0px</span>
                    <span>10px</span>
                  </div>
                </Section>

                <Section title="Border Color" description="Pick a color for your border">
                  <div className="flex flex-wrap gap-3">
                    {['#ffffff', '#ff4e00', '#00ff00', '#00ffff', '#ff00ff', '#ffff00', '#ff0000', '#4f46e5'].map(color => (
                      <button 
                        key={color}
                        onClick={() => updateField('profileBorderColor', color)}
                        className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${localCustom.profileBorderColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input 
                      type="color" 
                      value={localCustom.profileBorderColor || '#ffffff'}
                      onChange={(e) => updateField('profileBorderColor', e.target.value)}
                      className="w-10 h-10 rounded-full bg-transparent border-none cursor-pointer"
                    />
                  </div>
                </Section>

                <Section title="Border Glow" description="Add a glowing aura to your profile border">
                  <div className="flex flex-wrap gap-3">
                    {['#ffffff', '#ff4e00', '#00ff00', '#00ffff', '#ff00ff', '#ffff00', '#ff0000', '#4f46e5', 'transparent'].map(color => (
                      <button 
                        key={color}
                        onClick={() => updateNestedField('profileBorderGlow', 'color', color === 'transparent' ? '' : color)}
                        className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${localCustom.profileBorderGlow?.color === color ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color === 'transparent' ? 'transparent' : color, border: color === 'transparent' ? '1px dashed white' : '' }}
                      />
                    ))}
                    <input 
                      type="color" 
                      value={localCustom.profileBorderGlow?.color || '#ffffff'}
                      onChange={(e) => updateNestedField('profileBorderGlow', 'color', e.target.value)}
                      className="w-10 h-10 rounded-full bg-transparent border-none cursor-pointer"
                    />
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    value={localCustom.profileBorderGlow?.intensity || 0}
                    onChange={(e) => updateNestedField('profileBorderGlow', 'intensity', parseInt(e.target.value))}
                    className="w-full accent-indigo-500 mt-4"
                  />
                  <div className="flex justify-between text-[10px] text-white/30 mt-2 uppercase tracking-widest">
                    <span>None</span>
                    <span>Extreme</span>
                  </div>
                </Section>

                <Section title="Border Radius" description="How rounded should your profile be?">
                  <input 
                    type="range" 
                    min="0" 
                    max="48" 
                    value={localCustom.profileBorderRadius || 16}
                    onChange={(e) => updateField('profileBorderRadius', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </Section>
              </div>
            )}

            {activeTab === 'effects' && (
              <div className="space-y-8">
                <Section title="Profile Music" description="Add a soundtrack to your presence (SoundCloud/Spotify URL)">
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Paste URL here..."
                      value={localCustom.profileMusicUrl || ''}
                      onChange={(e) => updateField('profileMusicUrl', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="autoplay"
                        checked={localCustom.profileMusicAutoPlay || false}
                        onChange={(e) => updateField('profileMusicAutoPlay', e.target.checked)}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 accent-indigo-500"
                      />
                      <label htmlFor="autoplay" className="text-sm text-white/50">Enable Autoplay (where supported)</label>
                    </div>
                  </div>
                </Section>

                <Section title="Visual Effects" description="Special particles that appear on your profile">
                  <div className="grid grid-cols-3 gap-3">
                    {EFFECTS.map(effect => (
                      <button 
                        key={effect}
                        onClick={() => updateField('profileEffect', effect)}
                        className={`p-3 rounded-xl border transition-all text-sm capitalize ${localCustom.profileEffect === effect ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}
                      >
                        {effect}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Nitro Badge" description="Show off your support with a special badge">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                        <Zap className="text-white w-6 h-6 fill-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Nitro Supporter Badge</div>
                        <div className="text-[10px] text-white/40">Visible next to your name globally</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => updateField('nitroBadge', !localCustom.nitroBadge)}
                      className={`w-12 h-6 rounded-full transition-all relative ${localCustom.nitroBadge ? 'bg-indigo-500' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localCustom.nitroBadge ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </Section>

                <Section title="Custom CSS" description="Advanced: Inject custom styles (Experimental)">
                  <textarea 
                    placeholder=".profile-card { box-shadow: 0 0 50px rgba(255,0,0,0.5); }"
                    value={localCustom.customCss || ''}
                    onChange={(e) => updateField('customCss', e.target.value)}
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white font-mono text-xs focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </Section>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="w-96 border-l border-white/10 bg-black/40 p-8 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Live Preview</h3>
              <div className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase tracking-widest">Real-time</div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-8">
              {/* Profile Preview */}
              <div className="w-full" style={getGlobalStyles(localCustom)}>
                <div 
                  className="w-full bg-[#09090b] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl flex flex-col"
                  style={getProfileStyles(localCustom)}
                >
                  <div className="h-24 bg-zinc-800 relative shrink-0">
                    <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-white/10">
                      <Layout size={32} />
                    </div>
                  </div>

                  <div className="px-5 pb-6 relative">
                    <div 
                      className="absolute -top-10 left-5 w-20 h-20 rounded-full border-4 border-[#09090b] bg-zinc-800 overflow-hidden shadow-xl"
                      style={{ borderRadius: localCustom.profileBorderRadius ? `${localCustom.profileBorderRadius}px` : '9999px' }}
                    >
                      <div className="w-full h-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Zap size={24} />
                      </div>
                    </div>

                    <div className="pt-12">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h2 className="text-xl font-black tracking-tighter flex items-center gap-1.5" style={getUsernameStyles(localCustom)}>
                            {localCustom.usernameColor === '#ffffff' ? 'Your Name' : 'Customised'}
                            {localCustom.nitroBadge && (
                              <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                                <Zap size={10} className="fill-white" />
                              </div>
                            )}
                          </h2>
                          <p className="text-zinc-500 text-xs font-medium">@handle</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                          <div className="w-full h-2 bg-white/10 rounded-full mb-2" />
                          <div className="w-2/3 h-2 bg-white/5 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Preview */}
              <div className="w-full space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle size={14} className="text-zinc-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Chat Preview</span>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 shrink-0" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500" style={getUsernameStyles(localCustom)}>
                      Your Name
                    </span>
                    <div 
                      className="px-4 py-2 rounded-2xl bg-white text-black text-sm font-medium"
                      style={{ fontFamily: localCustom.profileFont || 'inherit' }}
                    >
                      This is how your messages will look to everyone else!
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <p className="text-[10px] text-indigo-300 font-medium leading-relaxed">
                This is how your profile card will appear to other users. Some effects like particles and music are only active in the full view.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <Sparkles size={14} className="text-indigo-400" />
            <span>Changes are applied instantly to your profile</span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ 
  active, onClick, icon, label 
}) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-white/40 hover:bg-white/5 hover:text-white/60'}`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
    {active && <motion.div layoutId="activeTab" className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
  </button>
);

const Section: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ 
  title, description, children 
}) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        {title}
      </h3>
      <p className="text-sm text-white/40">{description}</p>
    </div>
    {children}
  </div>
);

const FontCard: React.FC<{ font: string; active: boolean; onClick: () => void }> = ({ 
  font, active, onClick 
}) => (
  <button 
    onClick={onClick}
    className={`p-4 rounded-2xl border text-left transition-all group ${active ? 'bg-indigo-500 border-indigo-400 shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
  >
    <div className={`text-xs uppercase tracking-widest mb-2 ${active ? 'text-white/60' : 'text-white/20'}`}>Preview</div>
    <div className={`text-lg truncate ${active ? 'text-white' : 'text-white/80'}`} style={{ fontFamily: font }}>
      The quick brown fox
    </div>
    <div className={`text-[10px] mt-2 font-mono ${active ? 'text-white/40' : 'text-white/20'}`}>
      {font}
    </div>
  </button>
);

const Loader2 = ({ className, size }: { className?: string; size?: number }) => (
  <motion.div 
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
    className={className}
  >
    <Sparkles size={size} />
  </motion.div>
);
