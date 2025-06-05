export interface Feature {
  icon: React.ComponentType<{ size: number; className: string }>;
  title: string;
  description: string;
}