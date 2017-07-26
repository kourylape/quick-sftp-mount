#!/usr/bin/env node
'use strict';

const program = require('commander');
const settings = require('./settings');
const colors = require('colors');
const Table = require('cli-table');
const fs = require('fs');
const mkdirp = require('mkdirp');
const exec = require('child_process').exec;
const homedir = require('os').homedir();


const makeRed = (txt) => {
  console.log(colors.red(txt));
};

const checkSettings = () => {
  let response = { error: false, needsFixed: {} };
  const required = ['name', 'host', 'port', 'user', 'path'];
  const needOne = ['key','pass'];

  if(settings.hasOwnProperty('bookmarks')) {
    settings.bookmarks.forEach(function (bookmark, index) {
      index += 1;
      response.needsFixed[index] = [];

      for(const val of required) {
        if(!bookmark.hasOwnProperty(val)) {
          response.needsFixed[index].push(val);
        }
      };

      let oneOf;
      for(const val of needOne) {
        if(bookmark.hasOwnProperty(val)) {
          oneOf = true;
          break;
        } else {
          oneOf = false;
        }
      };
      if(!oneOf) {
        response.needsFixed[index].push('key or password');
      }

      if(response.needsFixed[index].length > 0) {
        response.error = true;
      }

    });
  } else {
    response.error = true;
  }

  if(response.error) {
    makeRed('You have error in your settings.json file!');
    makeRed('------------------------------------------');
    makeRed('Review the following items:');
    Object.keys(response.needsFixed).forEach(function(index) {
      const item = response.needsFixed[index];
      if(item.length > 0) {
        makeRed(' - Item: ' + index + ' is missing: [' + item.join(', ') + ']');
      }
    });
    process.exit(-1);
  }

};

const listFunction = () => {
  checkSettings();
  let table = new Table({
      head: ['Nickname', 'Path'],
      colWidths: [50, 30]
  });

  if(settings.hasOwnProperty('bookmarks')) {
    settings.bookmarks.forEach(function (bookmark) {
      const row = [
        bookmark.name,
        bookmark.path
      ]
      table.push(row);
    });
  }

  console.log(table.toString());
};


const mountFunction = (bookmark) => {
  checkSettings();
  const found = settings.bookmarks.filter(function (obj) {
    return obj.name == bookmark;
  });
  if(found.length > 0) {
    const bm = found[0];

    // create mount directory
    const mountDir = homedir + '/.sftp-mounts/' + bm.name;
    if (!fs.existsSync(mountDir)) {
      mkdirp(mountDir, function (err) {
        if (err) {
          console.error(err)
          process.exit(-1);
        }
      });
    }

    //build the command
    let cmd;
    if(bm.hasOwnProperty('key')) {
      cmd = 'sshfs -o IdentityFile='+bm.key+',allow_other,reconnect,workaround=truncate:rename -p '+bm.port+' '+bm.user+'@'+bm.host+':'+bm.path+' '+mountDir;
    } else {
      const cleanPass = bm.pass.replace(/([^0-9a-zA-Z])/g, function(match) {
        return '\\' + match;
      });
      cmd = 'echo '+cleanPass+' | sshfs -o ssh_command=\'ssh -p '+bm.port+' -o ConnectTimeout=8,PreferredAuthentications=password,StrictHostKeyChecking=no\',password_stdin,reconnect,allow_other,workaround=truncate:rename '+bm.user+'@'+bm.host+':'+bm.path+' '+mountDir;
    }
    //debug
    //console.log(cmd);

    //run the command
    exec(cmd, function(error, stdout, stderr) {
      if(error) {
        if (fs.existsSync(mountDir)) {
          makeRed(bm.name + ' seems to already be mounted!');
          process.exit(0);
        }
      } else {
        console.log(colors.green(bm.name + ' has been successfully mounted!'));
        process.exit(0);
      }
    });

  } else {
    makeRed('That bookmark could not be found!');
    makeRed('Use the `list` command to view all available bookmarks.');
    process.exit(-1);
  }
};

const unmountFunction = (bookmark) => {
  checkSettings();
  const found = settings.bookmarks.filter(function (obj) {
    return obj.name == bookmark;
  });
  if(found.length > 0) {
    const bm = found[0];

    // get mount directory
    const mountDir = homedir + '/.sftp-mounts/' + bm.name;
    if (!fs.existsSync(mountDir)) {
      makeRed(bm.name + ' does not seem to be mounted!');
      process.exit(-1);
    }

    //run the command
    const cmd = 'umount ' + mountDir;
    exec(cmd, function(error, stdout, stderr) {
      if(error) {
        if (fs.existsSync(mountDir)) {
          makeRed('Error! ' + bm.name + ' could not be unmounted!');
          process.exit(0);
        }
      } else {
        console.log(colors.yellow(bm.name + ' has been successfully unmounted!'));
        process.exit(0);
      }
    });

  } else {
    makeRed('That bookmark could not be found!');
    makeRed('Use the `list` command to view all available bookmarks.');
    process.exit(-1);
  }
};


program.version('1.0.0')
program.command('list').description('List available bookmarks').action(listFunction);
program.command('mount <bookmark_nickname>').description('Mount specified bookmark').action(mountFunction);
program.command('unmount <bookmark_nickname>').description('Unmount specified bookmark').action(unmountFunction);

// default to --help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
