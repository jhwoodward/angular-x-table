(function() {
    'use strict';

    angular.module('xtable').directive('xTable', xTable);

    /* @ngInject */
    function xTable($compile, $window, $timeout, $q, _, templates, stickyHeaderFactory) {
        var directive = {
            restrict: 'E',
            replace: true,
            scope: {
                /* model containing callback methods for row bindings */
                stm: '=?',
            },
            bindToController: {
                /* initial data to bind to - parents */
                data: '=',
                /* whatever's given here gets set as css class on table */
                type: '@?',
                /* also css class on table but this will replace the default */
                className: '@?class',
                /* method to get children when row is clicked,
                    expects a promise returning the array of children
                    don't mutate data */
                getChildren: '&?',
                /* compiled against row scope, so you can use row.*
                    if evaluates to false, no expand icon will appear and
                    getchildren will not be called */
                rowHasChildren: '@?',
                /* if true, getChildren will only be called once per row,
                    when expanded a second time the previously loaded children
                    are displayed */
                cacheChildren: '=?',
                onRowClick: '&?',
                onChildClick: '&?',
                onParentClick: '&?',
                spinnerType: '=?',
                loaded: '=',
                filtered: '=',
                /* if true, a checkbox columns is rendered and the onSelectionChange
                    callback will be triggered when selecting / deselecting items */
                selectable: '=?',
                /* arguments: selectedRows, selectedParents, selectedChildren
                    selectedRows is parents and children combined */
                onSelectionChange: '&?',
                onRowSelect: '&?',
                /* text to display when data is empty after loading and not filtered */
                emptyText: '=?',
                /* css class for the empty text wrapper */
                emptyCss: '@?',
                /* text to display when filtered data is empty after loading */
                filteredEmptyText: '=?',
                /* css class for child row icon
                    (default fa-mail-reply rotated 180 degrees) */
                iconChild: '@?',
                /* css class for parent row icon
                    (default fa-plus) */
                iconParent: '@?',
                /* css class for parent row icon when expanded
                    (default fa-minus) */
                iconParentExpanded: '@?',
                /* css class for loading icon
                    (default fa-cog) */
                iconLoading: '@?',
                /* if true the header will stay on the page when scrolling */
                stickyHeader: '=?',
                /* how far from the top of the page to start sticking the header
                    - eg when navbar needs to be uppermost */
                stickyOffset: '@?',
                /* compiled against row scope, so you can use row.*
                    when evaluates to true, 'warning' is added to css for the row */
                rowWarning: '@?',
                /* message to show as toolip on warning icon */
                rowWarningMessage: '@?',
                /* if true the header row is compiled to allow for bindings
                    default is false for performance (just the select all checkbox is compiled)
                */
                bindHeader: '=?',
                sortKey: '=?',
                sortDirection: '=?'
            },
            transclude: {
                'column': 'column',
                'actions': '?actions',
                'toolbar': '?toolbar'
            },
            controllerAs: 'st',
            controller: 'XtableController',
            link: linkFn,
            templateUrl: 'app/layout/stableTable/xTable.html'
        };

        return directive;

        function linkFn (scope, el, attr, st, transclude) {
            var table;
            var columns = [];
            var cells = [];
            var actionTemplate;
            var rowTemplate;
            var childScopes = [];
            var stickyHeader;

            st.expandable = attr.getChildren !== undefined;
            st.childClickable = attr.onChildClick !== undefined;
            st.parentClickable = attr.onParentClick !== undefined;
            st.rowClickable = attr.onRowClick !== undefined;

            activate();

            function activate() {
                transclude(scope, generateTable, null, 'column');
                transclude(scope, generateActionTemplate, null, 'actions');
                createRowTemplate();
                transclude(scope, addToolBar, null, 'toolbar');
                scope.$watchCollection('st.data', renderRows);
                if (st.stickyHeader) {
                    makeHeaderSticky();
                }
            }

            function generateTable (cols) {
                var wrapper = el.find('.st-table-wrapper');
                var thead = angular.element('<thead></thead>');
                table = angular.element(stTemplates.table({className: st.className, type: st.type}));
                wrapper.append(table);
                table.append(thead);
                setVisibleColumns(cols);
                buildHeader(thead);
                generateCells();
            }

            function renderRows() {
                var container = getRowContainer();
                _.each(st.data, function(row) {
                    var rowElement = $compile(rowTemplate.clone())(createRowScope(row));
                    row.st.element = rowElement;
                    container.append(rowElement);
                });
            }

            function makeHeaderSticky() {
                $timeout(function() {
                    stickyHeader = stickyHeaderFactory.create({
                        table: table,
                        offset: st.stickyOffset,
                        buildFn: buildHeader,
                        container: el
                    });
                });
            }

            function compileHeaderClick(col, fieldValue) {
                return ($compile(stTemplates.header.tplclick({
                    fn: col.attributes.headerclick.value,
                    field: fieldValue
                }))(createHeaderClickScope(col)));
            }

            function createHeaderClickScope(col) {
                var headerScope = scope.$new();
                var headerName = col.attributes.field.value;

                headerScope.doHeaderClick = function(key, sortFn) {
                    headerScope.$eval(sortFn)(key);
                    headerScope.state = st.sortKey === key ? 'active' : 'unactive';
                    headerScope.direction = headerScope.state === 'active' ? st.sortDirection : 'DESC';
                };
                headerScope.key =  col.attributes.field.value;

                headerScope.state = st.sortKey === headerName ? 'active' : 'unactive';
                headerScope.direction = headerScope.state === 'active' ? st.sortDirection : 'DESC';

                return headerScope;
            }

            function getRowContainer() {
                var rowContainer = table.find('tbody');
                if (!rowContainer.length) {
                    rowContainer = angular.element('<tbody></tbody>');
                    table.append(rowContainer);
                } else {
                    rowContainer.empty();
                    _.each(childScopes, function(scope) {
                        scope.$destroy();
                    });
                    childScopes = [];
                }
                return rowContainer;
            }

            /* filters out the columns where hidden = true */
            function setVisibleColumns(cols) {
                var visibleColumns = [];
                var i;
                for (i = 0; i < cols.length; i++) {
                    var hiddenAttr = cols[i].attributes.hidden;
                    var hidden = false;
                    if (hiddenAttr) {
                        hidden = scope.$eval(hiddenAttr.value);
                    }
                    if (!hidden) {
                        visibleColumns.push(cols[i]);
                    }
                }
                columns = visibleColumns;
            }

            /* the row template is generated once and then cloned for each row */
            function createRowTemplate() {
                rowTemplate = angular.element(stTemplates.row.template);
                if (cells.length) {
                    var warningIcon = angular.element(stTemplates.row.warningIcon);
                    cells[0].prepend(warningIcon);
                    cells[cells.length - 1].append(actionTemplate);
                    _.each(cells, function(cell) {
                        rowTemplate.append(cell);
                    });
                }
            }

            /* Inserts column header row into the supplied thead element
                using the content supplied in the <header> section of each
                column transclusion slot */
            function buildHeader(thead) {
                var tr = angular.element('<tr></tr>');
                var col;
                var th;
                var header;
                var fieldAttr;
                var sortUpDown;
                if (st.selectable) {
                    addSelectableHeader();
                }
                if (st.expandable) {
                    addExpandableHeader();
                }

                for (var j = 0; j < columns.length; j++) {
                    col = columns[j];
                    fieldAttr = col.attributes.field;
                    header = angular.element(col).find('header');
                    th = angular.element('<th></th>');
                    if (fieldAttr) {
                        th.attr('class', fieldAttr.value);
                    }
                    setAlignment(th, col.attributes.align);
                    if (header.length && !col.attributes.headerclick) {
                        th.append(header[0].innerHTML);
                    } else if (header.length && col.attributes.headerclick) {
                        th.append(compileHeaderClick(col, header[0].innerHTML));
                    }

                    tr.append(th);
                }
                if (st.bindHeader) {
                    thead.append($compile(tr)(scope));
                } else {
                    thead.append(tr);
                }

                thead.append($compile(tr)(scope));

                return thead;

                function addSelectableHeader() {
                    var th = angular.element('<th class="select"></th>');
                    var checkbox = angular.element(stTemplates.header.checkbox);
                    var label = angular.element('<label for="check-all" class="checkbox-label"></label>');
                    th.append(checkbox).append(label);
                    if (st.bindHeader) {
                        tr.append(th);
                    } else {
                        tr.append($compile(th)(scope));
                    }
                }
                function addExpandableHeader() {
                    tr.append('<th class="expand"></th>');
                }

            }

            function setAlignment(el, alignAttr) {
                if (alignAttr) {
                    switch (alignAttr.value) {
                        case 'right':
                            el.addClass('text-right');
                            break;
                        case 'center':
                        case 'centre':
                            el.addClass('text-center');
                            break;
                        default:
                            el.addClass('text-left');
                    }
                }
            }

            function addToolBar(toolbar) {
                var toolbarElement = angular.element(stTemplates.toolbar);
                toolbarElement.append(toolbar[0].innerHTML);
                el.append($compile(toolbarElement)(scope));
            }

            /* Loops through each visible <column> supplied in the transclusion
                (stored in the local columns variable), and generates cell
                templates which are added to the local cells array which
                will be used to generate the row template */
            function generateCells() {
                var i;
                var j;
                var col;
                var fieldAttr;
                var templates;
                var tmpl;
                var cell;
                var content;
                if (st.selectable) {
                    addSelectionCell();
                }
                if (st.expandable) {
                    addExpandableCell();
                }
                for (j = 0; j < columns.length; j++) {
                    col = columns[j];
                    fieldAttr = col.attributes.field;
                    templates = angular.element(col).find('template');
                    content = '';
                    for (i = 0; i < templates.length; i++) {
                        tmpl = templates[i];
                        if (tmpl.attributes.child) {
                            content += '<span ng-if="row.st._props.parent">' + tmpl.innerHTML + '</span>';
                        } else if (tmpl.attributes.parent) {
                            content += '<span ng-if="!row.st._props.parent">' + tmpl.innerHTML + '</span>';
                        } else {
                            content = tmpl.innerHTML;
                        }
                    }
                    cell = angular.element('<td>' + content + '</td>');
                    if (fieldAttr) {
                        cell.attr('class', fieldAttr.value);
                    }
                    setAlignment(cell, col.attributes.align);
                    cells.push(cell);
                }

                function addExpandableCell() {
                    var icon = stTemplates.row.expandableIcon({
                        child: st.iconChild,
                        parent: st.iconParent,
                        parentExpanded: st.iconParentExpanded,
                        loading: st.iconLoading,
                        processing: st.iconProcessing
                    });
                    var cell = angular.element('<td class="expand"></td>');
                    cell.append(icon);
                    cells.push(cell);
                }

                function addSelectionCell() {
                    var checkboxInput = angular.element(stTemplates.row.checkbox);
                    var checkboxLabel = angular.element('<label for="check-{{row.id}}" class="checkbox-label"></label>');
                    var cell = angular.element('<td class="select" stop-propagate></td>');
                    cell.append(checkboxInput).append(checkboxLabel);
                    cells.push(cell);
                }

            }

            /* Loops through supplied actions and generates the action cell */
            function generateActionTemplate(actionTransclusionElement) {
                var wrapper = angular.element('<div class="noselect sub-actions" stop-propagate></div>');
                var actions = angular.element(actionTransclusionElement).find('action');
                var j;
                var action;
                var content;
                var contentElement;
                for (j = 0; j < actions.length; j++) {
                    action = actions[j];
                    content = action.innerHTML;
                    if (action.attributes.clone) {
                        content = stTemplates.actions.clone({ fn: action.attributes.clone.value });
                    }
                    if (action.attributes.delete) {
                        content = stTemplates.actions.delete({ fn: action.attributes.delete.value });
                    }
                    if (action.attributes.archive) {
                        content = stTemplates.actions.archive({ fn: action.attributes.archive.value });
                    }
                    var ngif = [];
                    if (action.attributes.child) {
                        ngif.push('row.st._props.parent');
                    } else if (action.attributes.parent) {
                        ngif.push('!row.st._props.parent');
                    }
                    if (action.attributes.allow) {
                        ngif.push(action.attributes.allow.value);
                    }
                    if (ngif.length) {
                        contentElement = angular.element(content);
                        contentElement.attr('ng-if', ngif.join(' && '));
                        wrapper.append(contentElement);
                    } else {
                        wrapper.append(content);
                    }
                }
                actionTemplate = angular.element('<div class="actions"></div>');
                actionTemplate.append(wrapper);
            }

            /* Generates the scope for each row in the table */
            function createRowScope(row) {
                var rowScope = scope.$new();
                childScopes.push(rowScope);
                rowScope.row = row;
                rowScope.click = tryClick;
                rowScope.archive = archiveRow;
                rowScope.delete = deleteRow;
                rowScope.clone = cloneRow;
                rowScope.select = selectRow;

                row.st = row.st || {};
                row.st.setProps = setProps;
                var props = rowScope.props = row.st._props = row.st._props || {};
                setProps();
                
                /* Expose functionality to outer scope via api */
                row.st.api = {
                    flashHighlight: function() {
                        props.highlight =true;
                        $timeout(function() {
                            props.highlight = false;
                        }, 1500);
                    },
                    setHighlighted: function(highlighted) {
                        props.highlighted = highlighted;
                    }
                };
                if (!props.parent) {
                    _.extend(row.st.api, {
                        refreshChildren: refreshChildren,
                        expand: expand,
                        collapse: collapse,
                        isExpanded: function() {
                            return row.st._props.expanded || false;
                        }
                    };
                }

                return rowScope;

                function tryClick(event, index) {
                    if (!clickedEditable() && props.clickable) {
                        clickRow();
                    }

                    function clickedEditable() {
                        var clickTarget = angular.element(event.target);
                        if (clickTarget.hasClass('editable') ||
                            clickTarget.hasClass('editable-input') ||
                            clickTarget.is('input') ||
                            clickTarget.closest('.uib-datepicker-popup').length) {
                            return true;
                        }
                        return false;
                    }

                    function clickRow() {
                        if (!props.parent) {
                            if (!props.expanded && st.expandable) {
                                expand();
                            } else if (props.children) {
                                collapse();
                            }
                            if (st.parentClickable) {
                                st.onParentClick({event: event, row: row});
                            }
                        } else if (st.childClickable) {
                            st.onChildClick({event: event, row: row});
                        }
                        if (st.rowClickable) {
                            st.onRowClick({event: event, row: row});
                        }
                    }
                }

                function setProps() {
                    if (st.rowWarning) {
                        props.warning = rowScope.$eval(st.rowWarning);
                        if (st.rowWarningMessage) {
                            props.warningMessage = rowScope.$eval(st.rowWarningMessage);
                        }
                    }
                    props.expandable = hasChildren() && st.expandable && !props.parent && !props.expanded;
                    props.clickable =  (props.parent && st.childClickable) ||
                        (!props.parent && st.parentClickable) ||
                        (hasChildren() && st.expandable && !props.loading && !props.parent) ||
                        st.rowClickable;
                }

                function hasChildren() {
                    return st.rowHasChildren ? rowScope.$eval(st.rowHasChildren) : true;
                }

                function deleteRow(event, deleteFn, index) {
                    scope.$eval(deleteFn)(row).then(function(deleted) {
                        if (deleted) {
                            row.st.element.remove();
                            if (props.parent) {
                                removeChild();
                            }
                            if (props.selected) {
                                props.selected = false;
                                st.setSelectedRows();
                            }
                        }
                    });
                }

                function archiveRow(event, archiveFn, index) {
                    scope.$eval(archiveFn)(row).then(function(archived) {
                        if (archived) {
                            row.st.element.remove();
                            if (props.parent) {
                                removeChild();
                            }
                            if (props.selected) {
                                props.selected = false;
                                st.setSelectedRows();
                            }
                        }
                    });
                }

                function cloneRow(event, cloneFn) {
                    props.processing = true;
                    scope.$eval(cloneFn)(row).then(onCloneSuccess).finally(onCloneEnd);
                    
                    function onCloneSuccess(clone) {
                        if (clone) {
                            var clonedRowElement = ($compile(rowTemplate.clone())(createRowScope(clone)));
                            clone.st._props.highlight = true;
                            clone.st.element = clonedRowElement;
                            if (props.parent) {
                                clone.st._props.parent = props.parent;
                                var parent = findParent();
                                parent.st._props.children.unshift(clone);
                                if (props.lastChild) {
                                    props.lastChild = false;
                                    clone.st._props.lastChild = true;
                                }
                                row.st.element.after(clonedRowElement);
                            } else if (props.expanded) {
                                props.children[props.children.length - 1].st.element.after(clonedRowElement);
                            } else {
                                row.st.element.after(clonedRowElement);
                            }
                            $timeout(function() {
                                clone.st._props.highlight = false;
                            }, 1000);
                        }
                    }

                    function onCloneEnd() {
                        props.processing = false;
                    }

                }

                function removeChild() {
                    var parent = findParent();
                    var childIndex;
                    _.each(parent.st._props.children, function(e, i) {
                        if (e.id === row.id) {
                            childIndex = i;
                        }
                    });
                    parent.st._props.children.splice(childIndex, 1);
                    if (!parent.st._props.children.length) {
                        /* clickable / expandable depend on whether or not the row has children
                            so we need to call setProps to refresh these */
                        parent.st._props.expanded = false;
                        parent.st.setProps();
                    }
                    setFirstLastChild(parent);
                }

                function setFirstLastChild(parent) {
                    parent = parent || findParent();
                    var lastIndex = parent.st._props.children.length - 1;
                    _.each(parent.st._props.children, function(child, i) {
                        child.st._props.firstChild = i === 0;
                        child.st._props.lastChild = i === lastIndex;
                    });
                }

                function findParent() {
                    var parentRow;
                    _.each(st.data, function(e, i) {
                        if (props.parent === e.id) {
                            parentRow = e;
                            return;
                        }
                    });
                    return parentRow;
                }

                function refreshChildren() {
                    if (!props.parent && props.expanded) {
                        props.loading = true;
                        st.getChildren({id: row.id})
                            .then(function(children) {
                                removeChildRowElements();
                                return children;
                            }).then(setChildren)
                            .then(insertChildRowElements)
                            .then(st.setSelectedRows)
                            .finally(endLoading);
                    }
                }

                function expand() {
                    if (!props.loading && !props.expanded && st.expandable) {
                        getChildren()
                            .then(insertChildRowElements)
                            .finally(endLoading);
                    }
                }

                /* returns children as promise, from backend or cache */
                function getChildren() {
                    props.loading = true;
                    if (st.cacheChildren && props.children) {
                        var deferred = $q.defer();
                        $timeout(function() {
                            deferred.resolve(props.children);
                        }, 100);
                        return deferred.promise;
                    }
                    else {
                        return st.getChildren({id: row.id}).then(setChildren);
                    }
                }

                /* sets row's children property */
                function setChildren(children) {
                    if (children && children.length) {
                        _.each(children, function(child, index) {
                            child.st = {
                                _props: {
                                    parent: row.id,
                                    selected: props.selected
                                }
                            };
                            child.st._props.firstChild = index === 0;
                            child.st._props.lastChild = index === children.length - 1;
                        });
                        props.children = children;
                    }
                }

                function insertChildRowElements() {
                    var childElements = _.map(props.children, function(child) {
                        var childElement = $compile(rowTemplate.clone())(createRowScope(child));
                        child.st.element = childElement;
                        return childElement;
                    });
                    row.st.element.after(childElements);
                    props.expanded = true;
                    st.setSelectedRows();
                }

                function removeChildRowElements() {
                    _.each(props.children, function(child) {
                        if (child.st.element) {
                            child.st.element.remove();
                            child.st.element = undefined;
                        }
                    });
                }

                function endLoading() {
                    props.loading = false;
                }

                function collapse() {
                    if (props.expanded) {
                        removeChildRowElements();
                        props.expanded = false;
                    }
                }

                function selectRow(event) {
                    if (!props.parent && props.children) {
                        propagateSelectionToChildren();
                    }
                    if (props.parent) {
                        var parent = findParent();
                        if (props.selected) {
                            selectParentIfAllChildrenSelected(parent);
                        } else {
                            parent.st._props.selected = false;
                        }
                    }
                    if (props.selected && st.onRowSelect) {
                        st.onRowSelect({event:event, row: row});
                    }
                    st.setSelectedRows();

                    function selectParentIfAllChildrenSelected(parent) {
                        var children = parent.st._props.children;
                        var selectedChildren = children.filter(function(child) {
                            return child.st._props.selected;
                        });
                        if (children.length === selectedChildren.length) {
                            parent.st._props.selected = true;
                        }
                    }
                    function propagateSelectionToChildren() {
                        _.each(props.children, function(child) {
                            child.st._props.selected = props.selected;
                        });
                    }
                }
            }

            el.on('$destroy', function() {
                if (stickyHeader) {
                    stickyHeader.destroy();
                    stickyHeader = null;
                }
            });

        }
    }
})();
