module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		replace:{
			build: {
				src: ['future.js'],
				dest: 'dist/future.js',
				replacements: [{
					from: '{{VERSION}}',
					to: '<%= pkg.version %>'
				}]
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			build: {
				src: 'dist/future.js',
				dest: 'dist/future.min.js'
			}
		},
		
		yuidoc:{
			compile: {
				name: '<%= pkg.name %>',
				description: '<%= pkg.description %>',
				version: '<%= pkg.version %>',
				url: '<%= pkg.homepage %>',
				options: {
					exclude: 'dist',
					paths: './',
					outdir: '../futurejs-gh-pages/docs/'
				}
			}
		}
	});


grunt.loadNpmTasks('grunt-text-replace');
grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-contrib-yuidoc');

grunt.registerTask('default', ['replace', 'uglify', 'yuidoc']);

};