import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Calendar,
  Heart,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { AppSettings, Memories } from "./backend.d";
import {
  useAddMemory,
  useAppSettings,
  useDeleteMemory,
  useListMemories,
  useSetAppSettings,
  useUpdateMemory,
} from "./hooks/useQueries";

// ── Confetti sparkles ────────────────────────────────────────────────────────
const SPARKLES = [
  {
    top: "8%",
    left: "5%",
    cls: "sparkle-animate-1",
    size: 16,
    color: "oklch(0.75 0.18 60)",
  },
  {
    top: "15%",
    left: "92%",
    cls: "sparkle-animate-2",
    size: 20,
    color: "oklch(0.65 0.2 5)",
  },
  {
    top: "5%",
    left: "50%",
    cls: "sparkle-animate-3",
    size: 14,
    color: "oklch(0.72 0.16 320)",
  },
  {
    top: "25%",
    left: "88%",
    cls: "sparkle-animate-1",
    size: 12,
    color: "oklch(0.78 0.14 60)",
  },
  {
    top: "40%",
    left: "3%",
    cls: "sparkle-animate-2",
    size: 18,
    color: "oklch(0.68 0.18 10)",
  },
  {
    top: "60%",
    left: "96%",
    cls: "sparkle-animate-3",
    size: 10,
    color: "oklch(0.75 0.15 340)",
  },
];

function SparkleIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
    >
      <path d="M12 2 L13.5 9 L20 10.5 L13.5 12 L12 19 L10.5 12 L4 10.5 L10.5 9 Z" />
    </svg>
  );
}

function ConfettiLayer() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {SPARKLES.map((s) => (
        <div
          key={s.left}
          className={s.cls}
          style={{ position: "absolute", top: s.top, left: s.left }}
        >
          <SparkleIcon size={s.size} color={s.color} />
        </div>
      ))}
    </div>
  );
}

// ── Days counter ─────────────────────────────────────────────────────────────
function getDaysSince(dateStr: string): number {
  const start = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── Settings Edit Dialog ──────────────────────────────────────────────────────
function EditSettingsDialog({
  open,
  onClose,
  settings,
}: {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
}) {
  const [form, setForm] = useState<AppSettings>(settings);
  const mutation = useSetAppSettings();

  const handleSave = async () => {
    await mutation.mutateAsync(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-ocid="settings.dialog" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Edit Friendship Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="friendName">Friend's Name</Label>
            <Input
              id="friendName"
              data-ocid="settings.input"
              value={form.friendName}
              onChange={(e) =>
                setForm((p) => ({ ...p, friendName: e.target.value }))
              }
              placeholder="Your best friend's name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="anniversaryDate">Friendship Anniversary Date</Label>
            <Input
              id="anniversaryDate"
              data-ocid="settings.input"
              type="date"
              value={form.anniversaryDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, anniversaryDate: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="letter">Personal Letter</Label>
            <Textarea
              id="letter"
              data-ocid="settings.textarea"
              value={form.personalLetter}
              onChange={(e) =>
                setForm((p) => ({ ...p, personalLetter: e.target.value }))
              }
              placeholder="Write a heartfelt letter to your friend..."
              rows={6}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="settings.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={mutation.isPending}
            data-ocid="settings.save_button"
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Memory Form Dialog ────────────────────────────────────────────────────────
type MemoryFormData = { title: string; date: string; description: string };

function MemoryDialog({
  open,
  onClose,
  initial,
  onSave,
  isSaving,
}: {
  open: boolean;
  onClose: () => void;
  initial?: MemoryFormData;
  onSave: (data: MemoryFormData) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<MemoryFormData>(
    initial ?? { title: "", date: "", description: "" },
  );

  const handleSave = () => {
    if (!form.title.trim() || !form.date) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-ocid="memory.dialog" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {initial ? "Edit Memory" : "Add a Memory ✨"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="memTitle">Title</Label>
            <Input
              id="memTitle"
              data-ocid="memory.input"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="e.g. Our first coffee date"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="memDate">Date</Label>
            <Input
              id="memDate"
              data-ocid="memory.input"
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="memDesc">Description</Label>
            <Textarea
              id="memDesc"
              data-ocid="memory.textarea"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Describe this beautiful moment..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="memory.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !form.title.trim() || !form.date}
            data-ocid="memory.save_button"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {initial ? "Save Changes" : "Add Memory"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const { data: settings, isLoading: settingsLoading } = useAppSettings();
  const { data: memories = [], isLoading: memoriesLoading } = useListMemories();
  const addMemory = useAddMemory();
  const updateMemory = useUpdateMemory();
  const deleteMemory = useDeleteMemory();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addMemoryOpen, setAddMemoryOpen] = useState(false);
  const [editMemory, setEditMemory] = useState<Memories | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const friendName = settings?.friendName || "My Best Friend";
  const anniversaryDate = settings?.anniversaryDate || "";
  const personalLetter =
    settings?.personalLetter ||
    "To my dearest friend, every moment with you has been a treasure. Thank you for being my confidant, my cheerleader, and my partner in adventures. Here's to many more years of laughter, growth, and memories together!";
  const daysSince = anniversaryDate ? getDaysSince(anniversaryDate) : 365;

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <div className="min-h-screen">
      <Toaster position="top-center" />

      {/* ── Hero Section ── */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.94 0.06 5), oklch(0.95 0.05 340 / 0.8), oklch(0.93 0.06 60))",
          minHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ConfettiLayer />

        {/* Background image */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url('/assets/generated/friendship-hero.dim_1200x400.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Decorative circles */}
        <div
          className="absolute -top-20 -left-20 h-80 w-80 rounded-full opacity-30"
          style={{ background: "oklch(0.85 0.1 5)" }}
        />
        <div
          className="absolute -bottom-10 -right-20 h-60 w-60 rounded-full opacity-20"
          style={{ background: "oklch(0.82 0.1 60)" }}
        />

        <motion.div
          className="relative z-10 text-center px-6 max-w-3xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div
            variants={itemVariants}
            className="float-gentle inline-block mb-4"
          >
            <span
              className="font-script text-2xl"
              style={{ color: "oklch(0.55 0.18 10)" }}
            >
              celebrating
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-display font-bold leading-none mb-4"
            style={{ fontSize: "clamp(3rem, 10vw, 6rem)" }}
          >
            <span className="shimmer-text">1 Year</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="font-display text-2xl md:text-3xl font-medium mb-2"
            style={{ color: "oklch(0.38 0.1 10)" }}
          >
            of Friendship
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-2 my-6"
          >
            <Heart
              className="h-5 w-5 fill-current"
              style={{ color: "oklch(0.62 0.2 5)" }}
            />
            <span
              className="font-display text-xl font-semibold"
              style={{ color: "oklch(0.3 0.1 10)" }}
            >
              {settingsLoading ? (
                <Skeleton className="h-6 w-40 inline-block" />
              ) : (
                friendName
              )}
            </span>
            <Heart
              className="h-5 w-5 fill-current"
              style={{ color: "oklch(0.62 0.2 5)" }}
            />
          </motion.div>

          {anniversaryDate && (
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-2 mb-8"
            >
              <Calendar
                className="h-4 w-4"
                style={{ color: "oklch(0.55 0.12 15)" }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: "oklch(0.45 0.1 15)" }}
              >
                Since {formatDate(anniversaryDate)}
              </span>
            </motion.div>
          )}

          <motion.div variants={itemVariants}>
            <Button
              onClick={() => setSettingsOpen(true)}
              data-ocid="hero.edit_button"
              variant="outline"
              className="gap-2 rounded-full border-2 px-6"
              style={{
                borderColor: "oklch(0.7 0.12 5)",
                color: "oklch(0.42 0.15 5)",
                background: "oklch(1 0 0 / 0.6)",
              }}
            >
              <Pencil className="h-4 w-4" />
              Customize
            </Button>
          </motion.div>
        </motion.div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            aria-hidden="true"
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H0Z"
              fill="oklch(0.97 0.01 60)"
            />
          </svg>
        </div>
      </section>

      {/* ── Main Content ── */}
      <main className="max-w-4xl mx-auto px-4 py-16 space-y-20">
        {/* ── Friendship Stats ── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          aria-label="Friendship Stats"
        >
          <motion.h2
            variants={itemVariants}
            className="font-display text-3xl font-bold text-center mb-10"
            style={{ color: "oklch(0.32 0.1 10)" }}
          >
            Our Friendship in Numbers
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <Heart
                    className="h-8 w-8"
                    style={{ color: "oklch(0.62 0.2 5)" }}
                  />
                ),
                value: settingsLoading ? "…" : `${daysSince}`,
                label: "Days Together",
                sublabel: "of laughter & love",
              },
              {
                icon: (
                  <Star
                    className="h-8 w-8"
                    style={{ color: "oklch(0.72 0.16 60)" }}
                  />
                ),
                value: memoriesLoading ? "…" : `${memories.length}`,
                label: "Memories Kept",
                sublabel: "and counting",
              },
              {
                icon: (
                  <Sparkles
                    className="h-8 w-8"
                    style={{ color: "oklch(0.65 0.18 320)" }}
                  />
                ),
                value: "1",
                label: "Year of Friendship",
                sublabel: "the best kind of bond",
              },
            ].map((stat) => (
              <motion.div key={stat.label} variants={itemVariants}>
                <div className="stat-card rounded-2xl p-8 text-center shadow-warm">
                  <div className="flex justify-center mb-4">{stat.icon}</div>
                  <div
                    className="font-display font-bold mb-1"
                    style={{
                      fontSize: "clamp(2rem, 6vw, 3rem)",
                      color: "oklch(0.32 0.12 10)",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div className="font-semibold text-foreground">
                    {stat.label}
                  </div>
                  <div
                    className="text-sm mt-1"
                    style={{ color: "oklch(0.55 0.07 20)" }}
                  >
                    {stat.sublabel}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Personal Letter ── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          aria-label="Personal Letter"
        >
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between mb-8"
          >
            <h2
              className="font-display text-3xl font-bold"
              style={{ color: "oklch(0.32 0.1 10)" }}
            >
              <BookOpen
                className="inline h-7 w-7 mr-2"
                style={{ color: "oklch(0.62 0.18 5)" }}
              />
              A Letter for You
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              data-ocid="letter.edit_button"
              className="gap-1.5 rounded-full"
              style={{ color: "oklch(0.55 0.15 5)" }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="letter-card paper-texture rounded-2xl p-8 md:p-12 relative overflow-hidden">
              {/* Decorative corner */}
              <div className="absolute top-4 right-4 opacity-30">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                  aria-hidden="true"
                >
                  <path
                    d="M20 5 Q30 15 35 20 Q30 25 20 35 Q10 25 5 20 Q10 15 20 5Z"
                    fill="oklch(0.72 0.14 60)"
                  />
                </svg>
              </div>

              <p
                className="font-script text-2xl mb-6"
                style={{ color: "oklch(0.55 0.18 10)" }}
              >
                Dear {friendName},
              </p>

              {settingsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : (
                <p
                  className="font-body text-lg leading-relaxed whitespace-pre-wrap"
                  style={{ color: "oklch(0.3 0.06 20)" }}
                >
                  {personalLetter}
                </p>
              )}

              <p
                className="font-script text-xl mt-8"
                style={{ color: "oklch(0.55 0.18 10)" }}
              >
                With love & gratitude 🌸
              </p>
            </div>
          </motion.div>
        </motion.section>

        {/* ── Memories Timeline ── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          aria-label="Memories Timeline"
        >
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between mb-8"
          >
            <h2
              className="font-display text-3xl font-bold"
              style={{ color: "oklch(0.32 0.1 10)" }}
            >
              Our Memories
            </h2>
            <Button
              onClick={() => setAddMemoryOpen(true)}
              data-ocid="memory.open_modal_button"
              className="gap-2 rounded-full px-5"
              style={{ background: "oklch(0.6 0.18 5)", color: "white" }}
            >
              <Plus className="h-4 w-4" />
              Add Memory
            </Button>
          </motion.div>

          {memoriesLoading ? (
            <div data-ocid="memories.loading_state" className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : memories.length === 0 ? (
            <motion.div
              variants={itemVariants}
              data-ocid="memories.empty_state"
              className="text-center py-20 rounded-2xl"
              style={{
                background: "oklch(0.97 0.02 40)",
                border: "2px dashed oklch(0.85 0.06 30)",
              }}
            >
              <div className="text-5xl mb-4">🌸</div>
              <p
                className="font-display text-xl font-semibold mb-2"
                style={{ color: "oklch(0.42 0.1 15)" }}
              >
                No memories yet
              </p>
              <p className="text-muted-foreground mb-6">
                Start capturing your beautiful moments together
              </p>
              <Button
                onClick={() => setAddMemoryOpen(true)}
                data-ocid="memories.empty_state.primary_button"
                className="gap-2 rounded-full"
                style={{ background: "oklch(0.6 0.18 5)", color: "white" }}
              >
                <Plus className="h-4 w-4" />
                Add First Memory
              </Button>
            </motion.div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div
                className="absolute left-6 top-6 bottom-6 w-0.5 hidden sm:block"
                style={{
                  background:
                    "linear-gradient(to bottom, oklch(0.85 0.1 5), oklch(0.88 0.08 60))",
                }}
              />
              <div className="space-y-6">
                <AnimatePresence>
                  {[...memories]
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    )
                    .map((mem, idx) => (
                      <motion.div
                        key={mem.id.toString()}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.05 }}
                        data-ocid={`memories.item.${idx + 1}`}
                        className="sm:pl-16 relative"
                      >
                        {/* Timeline dot */}
                        <div
                          className="absolute left-4 top-6 h-4 w-4 rounded-full hidden sm:block"
                          style={{
                            background: "oklch(0.65 0.18 5)",
                            boxShadow: "0 0 0 3px oklch(0.94 0.05 5)",
                          }}
                        />

                        <div className="memory-card rounded-2xl p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3
                                  className="font-display text-lg font-semibold"
                                  style={{ color: "oklch(0.32 0.1 10)" }}
                                >
                                  {mem.title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-1.5 mb-3">
                                <Calendar
                                  className="h-3.5 w-3.5"
                                  style={{ color: "oklch(0.6 0.12 30)" }}
                                />
                                <span
                                  className="text-xs font-medium"
                                  style={{ color: "oklch(0.55 0.08 30)" }}
                                >
                                  {formatDate(mem.date)}
                                </span>
                              </div>
                              {mem.description && (
                                <p
                                  className="text-sm leading-relaxed"
                                  style={{ color: "oklch(0.42 0.05 20)" }}
                                >
                                  {mem.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => setEditMemory(mem)}
                                data-ocid={`memories.edit_button.${idx + 1}`}
                              >
                                <Pencil
                                  className="h-3.5 w-3.5"
                                  style={{ color: "oklch(0.55 0.1 30)" }}
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => setDeleteId(mem.id)}
                                data-ocid={`memories.delete_button.${idx + 1}`}
                              >
                                <Trash2
                                  className="h-3.5 w-3.5"
                                  style={{ color: "oklch(0.55 0.18 15)" }}
                                />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.section>
      </main>

      {/* ── Footer ── */}
      <footer
        className="text-center py-10 mt-8"
        style={{ borderTop: "1px solid oklch(0.88 0.04 40)" }}
      >
        <p className="text-sm" style={{ color: "oklch(0.6 0.05 30)" }}>
          Made with{" "}
          <Heart
            className="inline h-3.5 w-3.5 fill-current"
            style={{ color: "oklch(0.62 0.2 5)" }}
          />{" "}
          for {friendName} · {new Date().getFullYear()}
        </p>
        <p className="text-xs mt-1" style={{ color: "oklch(0.68 0.04 30)" }}>
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            Built with love using caffeine.ai
          </a>
        </p>
      </footer>

      {/* ── Dialogs ── */}
      {settings && (
        <EditSettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
        />
      )}

      <MemoryDialog
        open={addMemoryOpen}
        onClose={() => setAddMemoryOpen(false)}
        onSave={async (data) => {
          await addMemory.mutateAsync(data);
          setAddMemoryOpen(false);
        }}
        isSaving={addMemory.isPending}
      />

      {editMemory && (
        <MemoryDialog
          open={!!editMemory}
          onClose={() => setEditMemory(null)}
          initial={editMemory}
          onSave={async (data) => {
            await updateMemory.mutateAsync({ id: editMemory.id, ...data });
            setEditMemory(null);
          }}
          isSaving={updateMemory.isPending}
        />
      )}

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="memory.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this memory?</AlertDialogTitle>
            <AlertDialogDescription>
              This memory will be removed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="memory.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="memory.confirm_button"
              onClick={async () => {
                if (deleteId !== null) {
                  await deleteMemory.mutateAsync(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
