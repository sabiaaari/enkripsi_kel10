export type Note = {
  id: string;
  title: string;
  excerpt: string;
  category: "College" | "Ideas" | "Personal";
  pinned: boolean;
  updatedAt: string;
  color: "pink" | "sage" | "butter" | "primary";
};

export type FileItem = {
  id: string;
  name: string;
  file_name?: string;
  type: "image" | "document";
  size: string;
  updatedAt: string;
};

export const notes: Note[] = [
  {
    id: "n1",
    title: "Thermodynamics — Ch. 4 recap",
    excerpt: "Entropy always increases in an isolated system. Ask Bu Rani about the Carnot cycle example.",
    category: "College",
    pinned: true,
    updatedAt: "Today, 09:12",
    color: "primary",
  },
  {
    id: "n2",
    title: "App idea: sleep sound mixer",
    excerpt: "Layer rain, keyboard clicks and low hum. Maybe a knob-based UI, like a mixing desk.",
    category: "Ideas",
    pinned: true,
    updatedAt: "Yesterday",
    color: "sage",
  },
  {
    id: "n3",
    title: "Grocery + errands",
    excerpt: "Yarn (lilac + sage), oat milk, stamps for the package, water the basil.",
    category: "Personal",
    pinned: false,
    updatedAt: "Yesterday",
    color: "pink",
  },
  {
    id: "n4",
    title: "Linear algebra — eigenvectors",
    excerpt: "Av = λv. Still shaky on diagonalization, redo problem set 3 this weekend.",
    category: "College",
    pinned: false,
    updatedAt: "2 days ago",
    color: "butter",
  },
  {
    id: "n5",
    title: "Journal — small win",
    excerpt: "Finished the first sleeve today. Slow and a little wobbly, but it's mine.",
    category: "Personal",
    pinned: false,
    updatedAt: "3 days ago",
    color: "primary",
  },
  {
    id: "n6",
    title: "Zine layout notes",
    excerpt: "Try a three-column grid, hand-lettered headers, leave room for photos in the margins.",
    category: "Ideas",
    pinned: false,
    updatedAt: "4 days ago",
    color: "sage",
  },
];

export const files: FileItem[] = [
  { id: "f1", name: "campus-morning.jpg", type: "image", size: "2.1 MB", updatedAt: "Today" },
  { id: "f2", name: "studio-yarn-shelf.png", type: "image", size: "3.4 MB", updatedAt: "Yesterday" },
  { id: "f3", name: "thermo-syllabus.pdf", type: "document", size: "420 KB", updatedAt: "2 days ago" },
  { id: "f4", name: "lease-agreement.pdf", type: "document", size: "1.1 MB", updatedAt: "5 days ago" },
];

export const categoryMeta = {
  College: { color: "primary" as const, description: "Lectures, readings and problem sets." },
  Ideas: { color: "sage" as const, description: "Sparks worth coming back to." },
  Personal: { color: "pink" as const, description: "Life, errands and everyday thoughts." },
};

export const colorMap: Record<Note["color"], { bg: string; text: string; dot: string }> = {
  pink: { bg: "bg-moya-pink/40", text: "text-[#8a4f5f]", dot: "bg-moya-pink" },
  sage: { bg: "bg-moya-sage/40", text: "text-[#3f6b45]", dot: "bg-moya-sage" },
  butter: { bg: "bg-moya-butter/40", text: "text-[#8a6c1f]", dot: "bg-moya-butter" },
  primary: { bg: "bg-moya-primary/20", text: "text-moya-primarydark", dot: "bg-moya-primary" },
};
