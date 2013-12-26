module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		copy:{
			build: {
				files: [
					{ expand: true, src: ['future.js'], dest: 'dist/'}
				]
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


grunt.loadNpmTasks('grunt-contrib-copy');
grunt.loadNpmTasks('grunt-contrib-uglify');

grunt.registerTask('default', ['copy', 'uglify']);

};