declare module 'bad-words' {
  export default class Filter {
    constructor(options?: { emptyList?: boolean; placeHolder?: string; regex?: RegExp; replaceRegex?: RegExp; list?: string[] });
    isProfane(input: string): boolean;
    clean(input: string): string;
    addWords(...words: string[]): void;
    removeWords(...words: string[]): void;
  }
}