# Golden Sun Engine - HTML5
An online Golden Sun Engine built in HTML5 with Phaser.

See the [DEMO](https://jjppof.github.io/goldensun_html5/index).

Feel free to help! Please, reach me if you want to do so.

I'm avoiding making some docs for now because I'm constantly changing things.

## Tech stack
- [PhaserJS CE 2.15.0](http://phaser.io/)
- [TexturePacker 4.6.1](https://www.codeandweb.com/texturepacker)
- [PhysicsEditor 1.6.3](https://www.codeandweb.com/physicseditor)
- [Tiledmap Editor 1.1](https://www.mapeditor.org/) ([Tiledmap version problem fix](https://github.com/bjorn/tiled/issues/2058#issuecomment-458975579))

## Development environment

GSHTML5 has no external dependency, so there's no `npm install` or packages on CDN, etc. It's a standalone. Just clone the project and run it into a http server. I would recommend these steps:
- Clone the project;
- Download [node.js](https://nodejs.org/en/download/) and isntall it (make sure you add node.js in the system path);
- In the terminal, install a quick http server using `npm install http-server -g`;
- In the terminal, go to the root folder of the GSHTML5 you cloned and then run `http-server`;
- Go to your browser and access the address shown in the terminal (it's probably `http://localhost:8080/`).
- I strongly reccomend using [Visual Studio Code](https://code.visualstudio.com/download) to develop.

## Texture Packer configs
- Use *Phaser (JSONHash)* as *Data Format*.
- Check *Trim sprite names*.
- Check *Prepend folder names*.
- Folder organization to generate the sheet: `[sprite name (ex.: felix)]` -> `[action type (ex.: idle)]` -> `[direction (ex.: down)]` -> `[files: frame_index.ext (ex.: 03.png)]`.
- Move the action folder into the Texture Packer.
- The sheets are per action.

## Credits
- http://www.goldensunhacking.net/
- https://gamefaqs.gamespot.com/gba/561356-golden-sun-the-lost-age/faqs
- http://www.goldensun-syndicate.net/sprites/
- https://www.spriters-resource.com/game_boy_advance/gs/
- https://www.spriters-resource.com/game_boy_advance/gs2/
- Golden Sun franchise
