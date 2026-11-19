export type CoinKind = 'quarter' | 'dime' | 'penny';

/**
 * Coin photos: official United States Mint images (public domain), from Wikimedia Commons:
 *   quarter.png  "United States quarter, obverse, 2004.png" (white background made transparent)
 *   dime.png     "Dime Obverse 13.png"
 *   penny.png    "United States penny, obverse, 2002.png"
 * Stored in public/images/coins at 120 px wide.
 *
 * silver.css sizes the coins to scale: quarter 24.26 mm, penny 19.05 mm (0.785), dime 17.91 mm (0.738).
 */
export function CoinFace({ kind }: { kind: CoinKind }) {
  return (
    <img
      className="coin-face"
      src={`/images/coins/${kind}.png`}
      alt=""
      width={120}
      height={120}
      draggable={false}
      decoding="async"
    />
  );
}
