const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const find = require('find');
const styleguide = require('./lib/loadSnippet');
const handlebars = require('handlebars');

const DIR_PROJECT =  __dirname + '/project';
const DIR_STYLEGUIDE = __dirname + '/styleguide';

nodes = [];

function initFileStructure () {
	find.file(/\.md|\.hbs|\.json$/, DIR_PROJECT, function(files) {

		files.forEach(function (file) {
		  createNode(file);
		});
	});

	find.file(/\.hbs/, DIR_STYLEGUIDE + '/templates/snippets', function (files) {
		files.forEach(function (file) {
			handlebars.registerPartial(
				path.basename(file, '.hbs'),
				fs.readFileSync(file).toString('utf-8')
			);
		});
	});
}

function createNode (file, remove, removeNode) {
	let name = path.basename(file, path.extname(file));
	let node = (nodes[name]) ? nodes[name] : { name: name, path: path.dirname(file)};

	if (removeNode) {
	  nodes[name] = null;
	}
	else {
	  switch (path.extname(file)) {
		case '.md':
		  node.documentation = (remove) ? null : file;
		break;

		case '.json':
		  node.data = (remove) ? null : file;
		break;

		case '.hbs':
		  node.template = (remove) ? null : file;

		break;
	  }

	  nodes[name] = node;
	}

	// console.log('node created/updated:', node);
  }

const app = http.createServer(page);

function page (request, response) {
	var html;
	var path = url.parse(request.url, true).path.split('/');
	path.shift();

	var stuff = path.pop();

	if (stuff !== 'favicon.ico') {
		if (stuff) {
			if (path[0] === 'page') {
				console.log('Requested PAGE of:', stuff);
				html = styleguide.loadPage(stuff, {nodes: toObject(nodes)});
			}
			else {
				console.log('Requested MODULE of:', stuff);
				html = styleguide.loadSnippet(stuff, {nodes: toObject(nodes)});
			}
		}
		else {
			html = styleguide.loadStyleguidePage('styleguide/templates/start.hbs', {nodes: toObject(nodes)});
		}

		response.writeHead(200, {"Content-Type": "text/html"});
		response.write(html.string);
	}
	else {
		console.log('For now we ignore favicon.ico');
	}

	response.end();
}

console.log('Starting server');

function toObject (array) {
	var obj = {};

	for (let key in nodes) {
		obj[key] = nodes[key]
	}

	return obj;
}

function onListening() {
	var addr = app.address();
	var bind = typeof addr === 'string'
		? 'pipe ' + addr
		: 'port ' + addr.port;

	console.log('Listening on ' + bind);
}

initFileStructure();

app.listen(3000);
app.on('listening', onListening);

// One-liner for current directory, ignores .dotfiles and node_modules
chokidar.watch('./project', {ignoreInitial: true, ignored: /(^|[\/\\])\..|node_modules/}).on('all', (event, path) => {
	if (event == 'addDir') {
	  return;
	}

	console.log('-------------');
	console.log(event, path);
	createNode(path, event === 'unlink', event === 'unlinkDir');
	console.log('-------------');
	console.log(nodes);
  });
