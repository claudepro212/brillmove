# BrillMove

Free, unlimited chess game reviews in your browser. Type a Chess.com username, pick a game, and step through every move with Brilliant, Great, Best, Mistake and Blunder ratings, accuracy scores, coaches, share cards, a Brilliant Hunter, and player insights.

Everything runs client-side. There is no server and no build step: it's a static site (`index.html`, `app.js`, `fx.js`, `styles.css`).

## Run locally

The engine is WebAssembly, so the site must be served over HTTP. Opening `index.html` directly from disk won't start it.

```bash
ruby -run -e httpd . -p 8765
```

Then open http://localhost:8765.

## Credits

- Engine: [Stockfish.js 17.1](https://github.com/nmrugg/stockfish.js) (GPLv3); see `engine/COPYING.txt`
- Chess rules: [chess.js 0.10.3](https://github.com/jhlywa/chess.js) (BSD-2-Clause)
- Piece sets from the [lichess](https://github.com/lichess-org/lila) project: cburnett and merida (GPLv2+), chessnut (Apache 2.0), fantasy and spatial (MIT, Maurizio Monge), pixel by RhosGFX (CC0)
- Games are loaded from Chess.com's public API. BrillMove is not affiliated with or endorsed by Chess.com.
