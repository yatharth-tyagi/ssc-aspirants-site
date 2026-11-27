// Daily quiz: one entry per date (YYYY-MM-DD). Made in Admin → Daily quiz.
// Students only see dates up to today.
window.DAILY = {};

(function(){ // preview sample daily
 var d=new Date(Date.now()+19800000).toISOString().slice(0,10);
 window.DAILY[d]=window.DAILY[d]||{title:"Sample quiz (preview)",questions:[
  {q:"Who was the first President of India?",opts:["Dr Rajendra Prasad","Dr S Radhakrishnan","Zakir Husain","V V Giri"],a:0,why:"He was President from 1950 to 1962."},
  {q:"Which Article deals with Equality before law?",opts:["Article 12","Article 14","Article 19","Article 21"],a:1,why:"Article 14 – equality before law and equal protection of laws."},
  {q:"The Preamble was amended by which Amendment?",opts:["24th","42nd","44th","73rd"],a:1,why:"The 42nd Amendment, 1976."}]};
})();
