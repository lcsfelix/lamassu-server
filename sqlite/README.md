# SQLite Population Script

## Starting up environment

shell.nix script provided **in the root** of this repository, all you need to do to setup the environment is to run `nix-shell` on the folder. 

*Note*: nix-shell depends on the nix channel version, to force it to 19.03 (if you're on a different one) use `nix-shell -I nixpkgs=https://github.com/NixOS/nixpkgs-channels/archive/nixos-19.03.tar.gz`

## Installation

### Install node modules

Make sure you're running NodeJS 8.3 or higher. Ignore any warnings.

```
npm install
```
# Run script
```
Usage:
  node populate.js [--db PATH] [--schema PATH]
  
Options:
  --version     Show version number                                    [boolean]
  --db          the path to the database file [string] [default: "./lamassu.db"]
  -s, --schema  the path to the schema file   [string] [default: "./create.sql"]
  --help, -h    Show help                                              [boolean]
```
