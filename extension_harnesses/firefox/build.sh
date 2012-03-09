#!/usr/bin/ruby
YUI_COMPRESSOR = '/usr/bin/yuicompressor-2.4.2.jar'

class EverywhereExtensionBuilder
  EXTENSION_FILELIST = %w(
    blacklist.js
    conceptualizer_connect.js
    storage.js
    contextual.js
    intro.html
    conceptualizer.js
    contextual.xul
    options.xul
    logger.js
    logo-16x16.png
    logo-32x32.png
    tag_blacklist.js
  )

  def initialize(mode)
    @mode = mode
    @build_dir = File.join("build",mode.to_s)
    @tmp_dir = File.join(@build_dir,"tmp")
    @sandbox_dir = File.join(@build_dir,"sandbox")
    @stage_dir = File.join(@build_dir,"stage")
    @tag = `git describe --match "firefox-everywhere*"`
    tag = `git describe --match "firefox-everywhere*"`
    if tag =~ /everywhere-(.*)/
      @version = $1
    else
      raise "Invalid Version: #{tag}"
    end
    if mode == :debug
      @version += "-debug"
    end
  end

  # Filter the install rdf and put the version from git into it
  def do_install_rdf
    File.open(File.join(@sandbox_dir,'install.rdf'),'w') do |f|
      File.open('install.rdf').each do |line|
        if line =~ /em:version/
          f << "    <em:version>#{@version}</em:version>\n"
        else
          f << line
        end
      end
    end
  end

  def do_log_line_removal_and_version_replace
    `mkdir -p #{File.join(@tmp_dir,"chrome/content")}`
    EXTENSION_FILELIST.each do |filename|
      if filename =~ /\.js$/
        File.open(File.join(@tmp_dir,'chrome/content/',filename),'w') do |f|
          File.open('chrome/content/' + filename).each do |line|
            if !(line =~ /Logger.log/ or line =~ /EverywhereLogger\./)
              f << line
            end
            if line =~ /@VERSION@/
              f << line.gsub("@VERSION@",@version)
            end
          end
        end
      end
    end
  end

  # No longer does compression, just copies over the filtered file because we
  # don't want a minified extension for Mozilla
  def do_compression
    puts "Doing Compression"
    Dir[File.join(@tmp_dir,"chrome/content/*.js")].each do |filename|
      #`java -jar #{YUI_COMPRESSOR} #{filename} > #{File.join(@sandbox_dir,'chrome/content',File.basename(filename))}`
      `cp #{filename} #{File.join(@sandbox_dir,'chrome/content',File.basename(filename))}`
    end
    puts "Done Compression"
  end

  def copy_sandbox_to_stage
    puts "Copying Sandbox to Stage"
    puts "cp -r #{@sandbox_dir} #{@stage_dir}"
    `cp -r #{@sandbox_dir} #{@stage_dir}`
    puts "Done Copying Sandbox to Stage"
  end

  def zip_up_stage
    puts "Zipping up stage"
    Dir.chdir(@stage_dir);
    `zip conceptualizer-#{@version}.xpi chrome/content/* install.rdf chrome.manifest defaults/preferences/* chrome/locale/en-US/*`
    `mv conceptualizer-#{@version}.xpi ../../../`
    puts "Done Zipping up stage"
  end

  def cleanup
    Dir.chdir('../../..');
    `rm -rf build`
  end

  def build
    `rm -rf build`
    `mkdir -p #{File.join(@sandbox_dir,"chrome/content")}`
    `mkdir -p #{File.join(@sandbox_dir,"defaults/preferences")}`
    do_install_rdf
    if @mode == :debug
      EXTENSION_FILELIST.each do |filename|
        `cp #{File.join('chrome/content',filename)} #{File.join(@sandbox_dir,'chrome/content')}`
      end
      `cp -r defaults/preferences/defaults-debug.js #{File.join(@sandbox_dir,'defaults/preferences/defaults.js')}`
      `cp -r chrome/locale #{File.join(@sandbox_dir,'chrome')}`
    elsif @mode == :release
      do_log_line_removal_and_version_replace()
      do_compression()
      EXTENSION_FILELIST.each do |filename|
        if filename !~ /\.js$/
          `cp #{File.join('chrome/content',filename)} #{File.join(@sandbox_dir,'chrome/content')}`
        end
      end
      `cp -r defaults/preferences/defaults.js #{File.join(@sandbox_dir,'defaults/preferences/defaults.js')}`
      `cp -r chrome/locale #{File.join(@sandbox_dir,'chrome')}`
    end
    `cp chrome.manifest #{@sandbox_dir}`
    copy_sandbox_to_stage()
    zip_up_stage()
    cleanup
  end
end

release = EverywhereExtensionBuilder.new(:release)
release.build

debug = EverywhereExtensionBuilder.new(:debug)
debug.build
