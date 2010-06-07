google.load("visualization", "1", {packages:["scatterchart"]});
google.load("jquery", "1.4.2");
var data, chart, rows, items;
google.setOnLoadCallback(drawChart);
function showDetails(p) {
  var det = document.getElementById('details');
  var item = items[data.getValue(p.row, 0)];
  var detHtml = item.testname + " on ";
  detHtml += item.platform + ": ";
  var revvals = [], refvals = [];
  
  for (var i=0,ii=item.rev.length;i<ii;++i) {
    revvals.push(Number(item.rev[i]).toFixed(2));
  }
  detHtml += revvals.join(', ');
  detHtml += "<br>references: ";
  for (var i = 0, ii = item.references.length; i < ii; ++i) {
    refvals.push(Number(item.references[i]).toFixed(2));
  }
  detHtml += refvals.join(', ');
  det.innerHTML = detHtml;
};
function hideDetails(p) {
  document.getElementById('details').innerHTML = '';
};
function doEvents() {
  google.visualization.events.addListener(chart, 'onmouseover', showDetails);
  google.visualization.events.addListener(chart, 'onmouseout', hideDetails);
}
function drawChart() {
  data = new google.visualization.DataTable();
  data.addColumn('number', 'id');
  data.addColumn('number', 'reference');
  data.addColumn('number', 'target revision');
  data.addRows(rows);
  var cd = document.getElementById('chart_div');
  chart = new google.visualization.ScatterChart(cd);
  google.visualization.events.addListener(chart, 'ready', doEvents);
  chart.draw(data, {
    width: items.length * 12,
    pointsize: 10,
    height: cd.clientWidth / 4,
    titleX: 'test',
    titleY: 'ratio',
    legend: 'bottom',
    enableTooltip: false,
    colors: ['6666FF', 'FF0000']
  });
}
