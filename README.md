```sh
cd craft
npm install
npm run build
cd ..
gem install jekyll bundler
bundle config set --local path '.bundle'
bundle exec jekyll serve
```