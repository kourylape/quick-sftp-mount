# Quick SFTP Mount

This quickly allows mounting of SFTP drives using SSHFS. This script has been tested on OSX and Linux.

## Requirements

* [node](https://nodejs.org/en/) >= 4
* [npm](https://docs.npmjs.com/cli/install) >= 4
* [OSXFuse](https://osxfuse.github.io/) >= 3.0 (this is not needed for Linux)
* sshfs >= 2.8

## Installation

```
cd <project_directory>
npm install
```

### Optional

You can add `alias sqm="<project_directory>/index.js"` to your `~/.bash_profile` or `~/.bashrc` to allow running the command `sqm` from anywhere. This may require running `chmod +x index.js`.

## Settings

Create a `settings.json` file in the project root with all the connection information.

*Example*

```json
{
	"bookmarks": [
		{
			"name": "site-number-1",
			"host": "127.0.0.1",
			"port": 2222,
			"user": "denevents-staging",
			"pass": "pwwithescaped\"quotes",
      "path":  "wp-includes/css/"
		}, {
			"name": "site-number-2",
			"host": "127.0.0.2",
			"port": 22,
			"user": "awesomeuser",
			"key": "/home/users/me/.ssh/id_rsa",
	    "path": "/"
		}
	]
}
```

## Usage

`sqm` can be substituted for `node index.js` if you didn't do the optional alias setup.

| Command       | Details                    |
|---------------|----------------------------|
| `sqm list`    | List available bookmarks   |
| `sqm mount`   | Mount specified bookmark   |
| `sqm unmount` | Unmount specified bookmark |

**The default mount point is `~/.sftp_mounts`**
