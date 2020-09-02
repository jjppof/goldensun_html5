# Golden Sun Engine - HTML5
An online **Golden Sun Engine** entirely built in HTML5 with [PhaserJS CE 2.15.0](http://phaser.io/).

**See the [DEMO](https://jjppof.github.io/goldensun_html5/index).**

- Feel free to help! Check what I need help [here](https://github.com/jjppof/goldensun_html5/projects/2). Please, reach me if you want to do so.
- The goal of this project is not to do exactly the same engine as GS, but very similar.
- If you found any bug, please create an issue for it.
- Check the [wiki](https://github.com/jjppof/goldensun_html5/wiki) for database configuration, tutorials and project information.
- This repository is just the engine. I'm not planning to do maps, animations, items etc. Content here is just enough to show the functionalities.
- I use [projects](https://github.com/jjppof/goldensun_html5/projects/1) to write down things.
- There's no production environment for now, but I'm planning to do it with webpack and embed most of the assets.

## Running GS HTML5 on your computer

GSHTML5 has no external dependency, so there's no `npm install` or packages on CDN, etc. Just clone the project and run it into a http server. I would recommend these steps:
- Clone the project (or download it and extract the files);
- Download [node.js](https://nodejs.org/en/download/) and install it (make sure you add node.js in the system path, default install should do it);
- In the terminal of your computer, install a light http server by running `npm install http-server -g`;
- In the terminal, go to the root folder (use `cd` command: `cd path\to\gshtml5`) of the GS HTML5 you cloned/downloaded and then run `http-server`;
- Go to your browser (prefer Chrome based browsers) and access the address shown in the terminal (it's probably `http://localhost:8080/`).
- I strongly reccomend using [Visual Studio Code](https://code.visualstudio.com/download) to develop.

## Utils

Some useful tools that I use to manage the resources:
- [TexturePacker 4.6.1](https://www.codeandweb.com/texturepacker) (for creating spritesheets)
- [PhysicsEditor 1.6.3](https://www.codeandweb.com/physicseditor) (for creating collision structures)
- [Tiledmap Editor 1.1](https://www.mapeditor.org/) ([Tiledmap version problem fix](https://github.com/bjorn/tiled/issues/2058#issuecomment-458975579)) (for building maps)
- [Shoebox](https://renderhjs.net/shoebox/) (for creating fonts)
- [Golden Sun Editor](http://forum.goldensunhacking.net/index.php?action=downloads;sa=view;down=124) (for game info)
- [Paint.NET](https://www.getpaint.net/) (for images editing)
- [XnConvert](https://www.xnview.com/en/xnconvert/) (for batch image convertion)

## Credits
- **http://www.goldensunhacking.net/** (This project would be impossible without these guys. [discord](https://discord.gg/7qBjWE))
- https://gamefaqs.gamespot.com/gba/561356-golden-sun-the-lost-age/faqs
- http://www.goldensun-syndicate.net/sprites/
- https://www.spriters-resource.com/game_boy_advance/gs/
- https://www.spriters-resource.com/game_boy_advance/gs2/
- Golden Sun is copyright 2001-2003 Nintendo / CAMELOT.

All Golden Sun games and their media are property of Camelot Software Planning Ltd., Nintendo and/or Nintendo of America Inc., and are protected by United States and international copyright, trademark and other intellectual property laws.
