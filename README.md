# Golden Sun Engine - HTML5
An online **Golden Sun Engine** entirely built in HTML5 with [PhaserJS CE 2.15.0](http://phaser.io/).

**See the [DEMO](https://jjppof.github.io/goldensun_html5/index).** Prefer to use Chrome based browsers.

- **This repository is just the engine**. I'm not planning to do maps, animations, items etc. Content here is just enough to show the functionalities.
- People should be able to make a GS like game without any programming skills with this project.
- Feel free to help! Check what I need help [here](https://github.com/jjppof/goldensun_html5/projects). Please, reach me if you want to do so.
- The goal of this project is not to do exactly the same engine as GS, but very similar.
- If you found any bug, please create an [issue](https://github.com/jjppof/goldensun_html5/issues/new) for it.
- Issues are not very well explained, feel free to reach me for details about them.
- Check the [wiki](https://github.com/jjppof/goldensun_html5/wiki) for database configuration, tutorials and project information.
- There's no production environment for now, but I'm planning to do it with webpack and embed most of the assets.
- In the future, it will also be possible to distribute it by Electron (desktop) and/or Ionic (mobile).
- **Join us at [GSHC discord](https://discord.gg/jwKJDXC)** (#programming channel) for discussion about the project.

## Running GS-HTML5 on your computer

In order to run GS-HTML5 in your computer, just clone the project and run it into a http server. I would recommend these steps:
- Clone the project (or download it and extract the files);
- Download [node.js](https://nodejs.org/en/download/) and install it (make sure you add node.js in the system path, default install should do it);
- In the terminal of your computer, install a light http server by running `npm install http-server -g`;
- In the terminal, go to the root folder (use `cd` command: `cd path\to\gshtml5`) of the GS-HTML5 you cloned/downloaded and then run `http-server -c-1 -o`;
- If the browser didn't open automatically, go to your browser (prefer Chrome based browsers) and access the address shown in the terminal (it's probably `http://localhost:8080/`).

## For developers

GS-HTML5 supports both Javascript and Typescript. We use [Webpack](https://webpack.js.org/) to build the bundle and serve the development environment.
- I strongly reccomend using [Visual Studio Code](https://code.visualstudio.com/download) to develop.
- Install dev dependencies by running `npm install` in the root folder.
- Use `npm start` to start the development server.
- Use `npm run build` to generate a bundle.
- Use `npm run format` to format your code or just make a local commit to format automatically.
- Use these [guidelines](https://typedoc.org/guides/doccomments/) to comment code.
- Learn Phaser 2 by [examples](https://phaser.io/examples/v2) or by this [tutorial](https://phaser.io/tutorials/making-your-first-phaser-2-game). For reference, check their [API](http://phaser.io/docs/2.6.2/index).

## Utils

Some useful tools that I use to manage the resources:
- [Visual Studio Code](https://code.visualstudio.com/download) (for developing the game)
- [TexturePacker 4.6.1](https://www.codeandweb.com/texturepacker) (for creating spritesheets)
  - [Sprite Sheet Packer](https://www.codeandweb.com/free-sprite-sheet-packer) (free alternative for TexturePacker)
- [PhysicsEditor 1.6.3](https://www.codeandweb.com/physicseditor) (for creating collision structures)
  - [LoonPhysics](https://loonride.com/physics) (free alternative for PhysicsEditor)
- [Tiledmap Editor 1.1](https://www.mapeditor.org/) ([Tiledmap version problem fix](https://github.com/bjorn/tiled/issues/2058#issuecomment-458975579)) (for building maps and also collision structures)
- [Shoebox](https://renderhjs.net/shoebox/) (for creating fonts)
- [Golden Sun Editor](http://forum.goldensunhacking.net/index.php?action=downloads;sa=view;down=124) (for game info)
- [Paint.NET](https://www.getpaint.net/) (for images editing)
- [XnConvert](https://www.xnview.com/en/xnconvert/) (for batch image convertion)

## Credits
- **http://www.goldensunhacking.net/** (This project would be impossible without these guys)
- https://gamefaqs.gamespot.com/gba/561356-golden-sun-the-lost-age/faqs
- http://www.goldensun-syndicate.net/sprites/
- https://www.spriters-resource.com/game_boy_advance/gs/
- https://www.spriters-resource.com/game_boy_advance/gs2/
- Golden Sun is copyright 2001-2003 Nintendo / CAMELOT.

All Golden Sun games and their media are property of Camelot Software Planning Ltd., Nintendo and/or Nintendo of America Inc., and are protected by United States and international copyright, trademark and other intellectual property laws.
