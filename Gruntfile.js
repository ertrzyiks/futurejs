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
		}
	});


grunt.loadNpmTasks('grunt-text-replace');
grunt.loadNpmTasks('grunt-contrib-uglify');

grunt.registerTask('default', ['replace', 'uglify']);

};