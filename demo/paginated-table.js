import ConspiracyElement from "./conspiracy-element.js";

var pageProxy = new Proxy([], {
  get(target, property) {
    if (typeof property == "string" && property.match(/\d+/)) {
      if (!target[property]) {
        var n = Number(property);
        target[property] = { data: n, label: n + 1 }
      }
    }
    return target[property];
  }
});

// pageProxy.length = 3;
// console.log([...pageProxy]);
/* [
  { "data": 0, "label": 1 },
  { "data": 1, "label": 2 },
  { "data": 2, "label": 3 }
] */


class PaginatedTable extends ConspiracyElement {
  state = {
    pages: pageProxy,
    currentPage: 0,
    rowContents: new Map(),
    selectboxes: {}
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
      this.state.pages.length = 0;
      this.render();
      return;
    }
    var rows = this.state.rows = Array.from(this.table.querySelectorAll("tbody tr"));
    this.state.rowContents = new Map();
    for (var row of rows) {
      this.state.rowContents.set(row, row.innerText.toLowerCase());
    }
    this.ui.elements.searchbox.value = "";
    this.updatePagination();
    this.render();
  }

  updatePagination(e = {}) {
    var { state, ui } = this;
    var { rows } = this.state;
    var { searchbox } = ui.elements;
    if (searchbox.value) {
      var query = searchbox.value.toLowerCase();
      rows = rows.filter(r => state.rowContents.get(r).includes(query));
    }
    state.pages.length = Math.ceil(rows.length / this.pageSize);
    if (e && e.dispatchedFrom && e.dispatchedFrom.tagName == "SELECT") {
      state.currentPage = Number(e.dispatchedFrom.value);
    }
    if (e && e.dispatchedFrom == searchbox) {
      state.currentPage = 0;
    }
    state.selectboxes.selectedIndex = state.currentPage;
    var pageStart = state.currentPage * this.pageSize;
    var paginated = rows.slice(pageStart, pageStart + this.pageSize);
    var visible = new Set(paginated);
    for (var row of state.rows) {
      row.toggleAttribute("hidden", !visible.has(row));
    }
    this.render();
  }

  static observedAttributes = ["pagesize"];
  attributeChangedCallback(attr, was, value) {
    this.pageSize = Number(value) || 10;
    this.updatePagination();
  }

  static template = `
<style>
:host {
  display: block;
}

:host[hidden] {
  display: none;
}

.controls {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.controls.right {
  justify-content: flex-end;
}
</style>
<div class="controls">
  <div>
    <label for="table-search">Search</label>
    <input :element="searchbox" :on.input.composed="tableuichange" id="table-search">
  </div>

  <div>
    Page
    <select :element="pageselect" :on.input.composed="tableuichange" :assign="state.selectboxes">
      <option :if.not="state.pages.length" disabled selected>0</option>
      <option :each="option of state.pages" :attr.value="option.data">
        <!-- :option.label -->
      </option>
    </select>
    of <!-- :state.pages.length -->
  </div>
</div>
<slot></slot>
<div class="controls right">
  <div>
    Page
    <select :element="pageselect" :on.input.composed="tableuichange" :assign="state.selectboxes">
      <option :if.not="state.pages.length" disabled selected>0</option>
      <option :each="option of state.pages" :attr.value="option.data">
        <!-- :option.label -->
      </option>
    </select>
    of <!-- :state.pages.length -->
  </div>
</div>
  `
}

window.customElements.define("paginated-table", PaginatedTable);