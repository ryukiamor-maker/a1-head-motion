declare module "gifenc" {
  export type GifPalette = number[][];
  export type GifEncoderInstance = {
    bytes(): Uint8Array;
    finish(): void;
    writeFrame(
      pixels: Uint8Array,
      width: number,
      height: number,
      options: { delay?: number; palette: GifPalette; repeat?: number },
    ): void;
  };
  export function GIFEncoder(options?: { initialCapacity?: number }): GifEncoderInstance;
  export function applyPalette(rgba: Uint8Array, palette: GifPalette, format?: string): Uint8Array;
  export function quantize(rgba: Uint8Array, maxColors: number, options?: { format?: string }): GifPalette;
}
