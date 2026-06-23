export interface ThreadInfo {
  container: HTMLElement | null;
  extraContainer: HTMLElement | null;
  a: HTMLAnchorElement | null;
  title: string;
  author: string;
  messageCount: number;
}

export interface HiddenItem {
  container: HTMLElement | null;
  extraContainer: HTMLElement | null;
  title: string;
  author: string;
  reason: string;
  link: string;
}
