// Closed, reviewed Nightlab output contract shared with the embedded host.
export const nightlabNames = [
  'nightlab/airwave-tokens.css','nightlab/airwave.css','nightlab/studio.css','nightlab/embedded-studio.css','nightlab/studio-skins.css',
  'nightlab/studio.js','nightlab/composer-ui.js','nightlab/studio-appearance.js','nightlab/studio-preview.js','nightlab/preview-timeline.js',
  'nightlab/compiler-loader.js','nightlab/readback.js','nightlab/time-format.js','nightlab/studio-3d.js','nightlab/light-model.js','nightlab/enclosure-fit.js','nightlab/THREE-LICENSE.txt',
  'nightlab/compiler/nb1.wasm','nightlab/compiler/wasm_exec.js','nightlab/compiler/compiler-source.json','nightlab/compiler/GO-LICENSE.txt','nightlab/compiler/NB1-LICENSE.txt','nightlab/compiler/COLORKIT-LICENSE.txt',
  'nightlab/model-assets/blink1mk2_enclosure_diffuser_v3k.stl','nightlab/model-assets/blink1mk2_enclosure_frame_v3k.stl','nightlab/model-assets/source.json','nightlab/model-assets/seating-fit.json','nightlab/model-assets/LICENSE.txt',
  'nightlab/model.html','nightlab/model-notes.js','nightlab/home.css',
];
export const gzipNames = new Set([
  'nightlab/studio-3d.js','nightlab/compiler/nb1.wasm',
  'nightlab/model-assets/blink1mk2_enclosure_diffuser_v3k.stl','nightlab/model-assets/blink1mk2_enclosure_frame_v3k.stl',
]);
export const optionalNames = new Set(nightlabNames.filter(name => /^(?:nightlab\/(?:compiler\/|model-assets\/))/.test(name) || [
  'nightlab/studio-3d.js','nightlab/light-model.js','nightlab/enclosure-fit.js','nightlab/THREE-LICENSE.txt','nightlab/model.html','nightlab/model-notes.js','nightlab/home.css',
].includes(name)));
