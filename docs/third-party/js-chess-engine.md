# js-chess-engine

- Package: `js-chess-engine`
- Version: `2.4.6`
- Source: https://github.com/josefjadrny/js-chess-engine
- License: MIT

The WeChat Mini Program bundles are generated with `npm run build:chess`. The main-thread bundle is stored at `miniprogram/vendor/js-chess-engine.js`; the standalone Worker bundle is stored at `miniprogram/workers/chess-ai.js`. The Worker is bundled without cross-directory runtime imports so it remains isolated from the Mini Program main thread.

The bundles provide legal move generation, castling, en passant, promotion, check/checkmate/stalemate detection, and the computer search used by the chess game.

The same bundle includes `chess.js` 1.4.0 (BSD-2-Clause) as the authoritative game state and move-rules implementation. `js-chess-engine` is used only to select robot moves.
