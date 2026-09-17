"""Color-match an ImageGen fur swatch to the authored Head3 fur reference.

Run with a Python environment that provides Pillow:
  python scripts/match-head3-fur.py

The operation is channel-wise affine color matching only. It preserves the
generated strand structure while bringing its mean color and contrast back to
the original 4096 px atlas crop.
"""
from pathlib import Path

from PIL import Image, ImageStat


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "output/imagegen/head3-completion-fur-raw.png"
REFERENCE = ROOT / "output/imagegen/head3-original-fur-reference.png"
OUTPUT = ROOT / "public/head3/model3-completion-fur.png"


def channel_stats(image: Image.Image) -> tuple[list[float], list[float]]:
    stats = ImageStat.Stat(image.convert("RGB"))
    return list(stats.mean), list(stats.stddev)


def main() -> None:
    source = Image.open(SOURCE).convert("RGB")
    reference = Image.open(REFERENCE).convert("RGB")
    source_mean, source_std = channel_stats(source)
    reference_mean, reference_std = channel_stats(reference)

    corrected_channels = []
    for channel, mean, std, target_mean, target_std in zip(
        source.split(), source_mean, source_std, reference_mean, reference_std
    ):
        scale = target_std / max(std, 1e-6)
        offset = target_mean - mean * scale
        corrected_channels.append(
            channel.point(lambda value, s=scale, o=offset: max(0, min(255, round(value * s + o))))
        )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    Image.merge("RGB", corrected_channels).save(OUTPUT, optimize=True)
    result_mean, result_std = channel_stats(Image.open(OUTPUT))
    print(f"Wrote {OUTPUT.relative_to(ROOT)} at {source.width}x{source.height}")
    print("Reference mean/std:", reference_mean, reference_std)
    print("Output mean/std:", result_mean, result_std)


if __name__ == "__main__":
    main()
