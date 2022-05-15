import ConspiracyElement from "./conspiracy-element.js";

var pageProxy = new Proxy([], {
  get(target, property) {
    if (property.match(/\d+/)) {
      if (!target[property]) {
        var n = Number(property);
        target[property] = {
          data: n,
          label: `Page #${n + 1}`
        }
      }
    }
    return target[property];
  }
});

class PaginatedTable extends ConspiracyElement {
  state = {
    pages: pageProxy,
    currentPage: 0,
    rowContents: new Map()
  };
  pageSize = 10;

  constructor() {
    super();
    var observer = new MutationObserver(this.indexTable.bind(this));
    observer.observe(this, { childList: true });
    this.indexTable();
    this.addEventListener("tableuichange", this.updatePagination);
  }

  indexTable() {
    this.table = this.querySelector("table");
    if (!this.table) {
      this.state.rows = [];
      this.state.state.pages.length = 0;
      this.render();
      return;
    }
    var rows = this.state.rows = Array.from(this.table.querySelectorAll("tbody tr"));
    this.state.rowContents = new Map();
    for (var row of rows) {
      this.state.rowContents.set(row, row.innerText.toLowerCase());
    }
    this.state.pages.length = (rows.length / this.pageSize) | 0;
    this.render();
    this.ui.elements.searchbox.value = "";
    this.updatePagination();
  }

  updatePagination(e = {}) {
    var { state, ui } = this;
    var { rows } = this.state;
    var { searchbox, pageselect } = ui.elements;
    if (searchbox.value) {
      var query = searchbox.value.toLowerCase();
      rows = rows.filter(r => state.rowContents.get(r).includes(query));
    }
    state.pages.length = (rows.length / this.pageSize + 1) | 0;
    state.currentPage = pageselect.value;
    if (e) {
      if (e.dispatchedFrom == searchbox) {
        state.currentPage = 0;
      }
    }
    var pageStart = state.currentPage * this.pageSize;
    var paginated = rows.slice(pageStart, pageStart + this.pageSize);
    var visible = new Set(paginated);
    for (var row of state.rows) {
      row.toggleAttribute("hidden", !visible.has(row));
    }
    this.render();
  }

  static template = `
<div class="controls">
  <label for="table-search">Search</label>
  <input :element="searchbox" :on.input.composed="tableuichange" id="table-search">

  <select :element="pageselect" :on.input.composed="tableuichange" :attr.selectedindex="state.currentPage">
    <option :each="option of state.pages" :attr.value="option.data">
      <!-- :option.label -->
    </option>
  </select>
</div>
<slot></slot>
  `
}

window.customElements.define("paginated-table", PaginatedTable);