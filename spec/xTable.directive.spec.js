/* jshint -W117, -W030 */
describe('Splendid Table Directive', function() {

    var $compile;
    var $rootScope;
    var $timeout;
    var $q;
    var mock;
    var data;
    var service;
    var mockWindow;

    function getElements(el) {
        var table = el.find('table');
        var thead = table.find('thead');
        var theadRow = thead.find('tr');
        var th = theadRow.find('th');
        var tbody = table.find('tbody');
        var rows = tbody.find('tr');
        var cells = rows.find('td');
        var firstRow = angular.element(rows[0]);
        var toolbar = el.find('.st-toolbar');
        function getRow(index) {
            return angular.element(rows[index]);
        }
        return {
            table: table,
            thead: thead,
            theadRow: theadRow,
            th: th,
            tbody: tbody,
            rows: rows,
            cells: cells,
            firstRow: firstRow,
            getRow: getRow,
            toolbar: toolbar
        };
    }

    function compile(html) {
        var el = angular.element(html);
        $compile(el)(scope);
        scope.$digest();
        return el;
    }

    function mockPromise(returnData) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        deferred.resolve(returnData);
        return promise;
    }

    beforeEach(module('app.lineItem'));
    beforeEach(module('app.layout', function ($provide) {
        var onScrollCallback;
        var onResizeCallback;
        mockWindow = {
            document: {},
            scroll : function() {
                if (onScrollCallback) {
                    onScrollCallback();
                }
            },
            resize : function() {
                if (onResizeCallback) {
                    onResizeCallback();
                }
            },
            addEventListener: function(event, cb) {
                if (event === 'scroll') {
                    onScrollCallback = cb;
                }
                if (event === 'resize') {
                    onResizeCallback = cb;
                }
            },
            removeEventListener: angular.noop
        };
        $provide.value('$window', mockWindow);
    }));
    beforeEach(inject(function(_$compile_, _$q_, _$rootScope_, _$timeout_) {
        $rootScope = _$rootScope_;
        $compile = _$compile_;
        $timeout = _$timeout_;
        $q = _$q_;
        mock = mockData.stableTable;
        service = mock.getService(_$q_);
        data = angular.copy(mock.data);
        scope = $rootScope.$new();
    }));

    afterEach(function() {
        $compile = null;
        $rootScope = null;
        $timeout = null;
        $q = null;
        mock = null;
        data = null;
        service = null;
    });

    it('should render an html table', function() {
        var el = compile(mock.html.basic);
        scope.data = data;
        scope.$digest();
        var elements = getElements(el);
        expect(elements.table.length).to.equal(1);
        expect(elements.thead.length).to.equal(1);
        expect(elements.theadRow.length).to.equal(1);
        expect(elements.th.length).to.equal(3);
        expect(elements.tbody.length).to.equal(1);
        expect(elements.rows.length).to.equal(3);
        expect(elements.cells.length).to.equal(9);
        expect(angular.element(elements.cells[0]).find('span')[0].innerHTML).to.equal('John');
        expect(elements.cells[1].innerHTML).to.equal('10');
        expect(elements.cells[2].innerHTML).to.equal('England');
    });

    it('should align header and cells as specified', function() {
        var el = compile(mock.html.basic);
        scope.data = data;
        scope.$digest();
        var elements = getElements(el);
        expect(elements.thead.find('.name').hasClass('text-left')).to.be.true;
        expect(elements.tbody.find('.name').hasClass('text-left')).to.be.true;
        expect(elements.thead.find('.age').hasClass('text-right')).to.be.true;
        expect(elements.tbody.find('.age').hasClass('text-right')).to.be.true;
        expect(elements.thead.find('.country').hasClass('text-center')).to.be.true;
        expect(elements.tbody.find('.country').hasClass('text-center')).to.be.true;
    });

    describe('sticky header', function() {
        it('should make header sticky if required', function() {
            var el = compile(mock.html.stickyHeader);
            scope.data = data;
            scope.$digest();
            $timeout.flush();
            expect(el.find('.sticky-clone').length).to.equal(0);
            mockWindow.scroll();
            expect(el.find('.sticky-clone').length).to.equal(1);
            el.remove();
            expect(el.find('.sticky-clone').length).to.equal(0);
        });

        it('should resize width to fit table', function() {
            var el = compile(mock.html.stickyHeader);
            var table = el.find('table');
            table.width(800);
            scope.data = data;
            scope.$digest();
            $timeout.flush();
            mockWindow.scroll();
            expect(el.find('.sticky-clone').width()).to.equal(800);
            table.width(1000);
            mockWindow.resize();
            expect(el.find('.sticky-clone').width()).to.equal(1000);
        });
    });

    it('should bind header to scope if required', function() {
        var el = compile(mock.html.bindHeader);
        scope.data = data;
        scope.vm = {
            onNameHeaderClick: sinon.stub()
        };
        scope.$digest();
        var nameButton = el.find('.nameButton');
        expect(nameButton.length).to.equal(1);
        nameButton.click();
        expect(scope.vm.onNameHeaderClick.called).to.be.true;
    });

    it('should show row warning with message', function() {
        var el = compile(mock.html.rowWarning);
        scope.data = data;
        scope.$digest();
        var elements = getElements(el);
        expect(elements.firstRow.hasClass('warning')).to.be.true;
        var warningIcon = elements.firstRow.find('i.notification');
        expect(warningIcon.length).to.equal(1);
        var warningMessage = warningIcon.attr('uib-tooltip');
        expect(warningMessage).to.equal('Hull is hell');
    });

    it('should add field names as css class on cells', function() {
        var el = compile(mock.html.basic);
        scope.data = data;
        scope.$digest();
        var elements = getElements(el);

        expect(angular.element(elements.cells[0]).hasClass('name')).to.be.true;
        expect(angular.element(elements.cells[1]).hasClass('age')).to.be.true;
        expect(angular.element(elements.cells[2]).hasClass('country')).to.be.true;
    });

    it('should fire onRowClick callback (if set) when row clicked', function() {
        var el = compile(mock.html.basic);
        scope.vm = {
            onRowClick: sinon.stub()
        };
        scope.data = data;
        scope.$digest();
        var elements = getElements(el);
        var parentRow = elements.getRow(0);
        expect(parentRow.hasClass('parent-row')).to.be.true;
        parentRow.click();
        expect(scope.vm.onRowClick.called).to.be.true;
    });

    it('should not render hidden columns', function() {
        var el, elements;
        el = compile(mock.html.columnPermissions);
        scope.data = data;
        scope.$digest();
        elements = getElements(el);
        expect(elements.th.length).to.equal(3);
        expect(elements.cells.length).to.equal(9);

        scope = $rootScope.$new();
        scope.vm = {
            hideColumnOne: false,
            hideColumnTwo: true,
            hideColumnThree: false
        };
        el = compile(mock.html.columnPermissions);
        scope.data = data;
        scope.$digest();
        elements = getElements(el);
        expect(elements.th.length).to.equal(2);
        expect(elements.cells.length).to.equal(6);

        scope = $rootScope.$new();
        scope.vm = {
            hideColumnOne: true,
            hideColumnTwo: true,
            hideColumnThree: false
        };
        el = compile(mock.html.columnPermissions);
        scope.data = data;
        scope.$digest();
        elements = getElements(el);
        expect(elements.th.length).to.equal(1);
        expect(elements.cells.length).to.equal(3);

        scope = $rootScope.$new();
        scope.vm = {
            hideColumnOne: true,
            hideColumnTwo: true,
            hideColumnThree: true
        };
        el = compile(mock.html.columnPermissions);
        scope.data = data;
        scope.$digest();
        elements = getElements(el);
        expect(elements.th.length).to.equal(0);
        expect(elements.cells.length).to.equal(0);
    });

    describe('when changing state', function() {
        describe('when loading', function() {
            it('should render the loading template', function() {
                var el = compile(mock.html.state);
                scope.vm = {
                    loaded: false
                };
                scope.data = [];
                scope.$digest();
                expect(el.find('.st-table-wrapper').hasClass('opaque')).to.be.false;
                expect(el.find('.st-loading-wrapper').hasClass('ng-hide')).to.be.false;
                expect(el.find('.st-filtered-empty-wrapper').hasClass('ng-hide')).to.be.true;
                expect(el.find('.st-empty-wrapper').hasClass('ng-hide')).to.be.true;

            });
        });
        it('when loaded with data', function() {
            it('should render the table template', function() {
                var el = compile(mock.html.state);
                scope.vm = {
                    loaded: false
                };
                scope.data = [];
                scope.$digest();
                scope.vm.loaded = true;
                scope.data = data;
                scope.$digest();
                expect(el.find('.st-table-wrapper').hasClass('opaque')).to.be.true;
                expect(el.find('.st-loading-wrapper').hasClass('ng-hide')).to.be.true;
                expect(el.find('.st-filtered-empty-wrapper').hasClass('ng-hide')).to.be.true;
                expect(el.find('.st-empty-wrapper').hasClass('ng-hide')).to.be.true;
            });
        });
        describe('when loaded and not filtered and no data present', function() {
            it('should render the empty template', function() {
                var el = compile(mock.html.state);
                scope.vm = {
                    loaded: true
                };
                scope.data = [];
                scope.$digest();
                scope.vm.loaded = true;
                scope.$digest();
                expect(el.find('.st-table-wrapper').hasClass('opaque')).to.be.false;
                expect(el.find('.st-loading-wrapper').hasClass('ng-hide')).to.be.true;
                expect(el.find('.st-filtered-empty-wrapper').hasClass('ng-hide')).to.be.true;
                expect(el.find('.st-empty-wrapper').hasClass('ng-hide')).to.be.false;
            });
        });
        describe('when loaded and filtered and no data present', function() {
            it('should render the empty filtered template', function() {
                var el = compile(mock.html.state);
                scope.vm = {
                    loaded: false
                };
                scope.data = [];
                scope.$digest();
                scope.vm.loaded = true;
                scope.vm.filtered = true;
                scope.$digest();
                expect(el.find('.st-table-wrapper').hasClass('opaque')).to.be.false;
                expect(el.find('.st-loading-wrapper').hasClass('ng-hide')).to.be.true;
                expect(el.find('.st-filtered-empty-wrapper').hasClass('ng-hide')).to.be.false;
                expect(el.find('.st-empty-wrapper').hasClass('ng-hide')).to.be.true;
            });
        });
    });

    describe('when selectable', function() {
        function selectable() {
            var el = compile(mock.html.selectable);
            scope.data = data;
            scope.vm = scope.vm || {};
            scope.vm.selectedRows = [];
            scope.vm.selectionChangeCalled = false;
            scope.vm.onSelectionChange = function(selectedRows) {
                scope.vm.selectedRows = selectedRows;
                scope.vm.selectionChangeCalled = true;
            };
            scope.vm.onRowSelect = function(event, row) {
                scope.vm.selectedRow = row;
                scope.vm.rowSelectCalled = true;
            };
            scope.$digest();
            return el;
        }

        it('should render selection column', function() {
            var el = selectable();
            var elements = getElements(el);
            expect(elements.table.length).to.equal(1);
            expect(elements.thead.length).to.equal(1);
            expect(elements.theadRow.length).to.equal(1);
            expect(elements.th.length).to.equal(4);
            expect(elements.tbody.length).to.equal(1);
            expect(elements.rows.length).to.equal(3);
            expect(elements.cells.length).to.equal(12);

            var selectableCells = elements.rows.find('td.select');
            var checkboxes = selectableCells.find('input[type=checkbox]');
            expect(checkboxes.length).to.equal(3);
        });

        it('should be able to select/deselect all rows', function() {
            var el = selectable();
            var elements = getElements(el);
            expect(scope.vm.selectedRows.length).to.equal(0);
            var selectAllCheckbox = elements.thead.find('input[type=checkbox]');
            expect(selectAllCheckbox.length).to.equal(1);
            selectAllCheckbox[0].click();
            expect(scope.vm.selectedRows.length).to.equal(scope.data.length);
            selectAllCheckbox[0].click();
            expect(scope.vm.selectedRows.length).to.equal(0);
        });

        it('should trigger the onSelectionChange callback (if set)', function() {
            var el = selectable();
            var elements = getElements(el);
            var selectAllCheckbox = elements.thead.find('input[type=checkbox]');
            expect(selectAllCheckbox.length).to.equal(1);
            selectAllCheckbox[0].click();
            expect(scope.vm.selectionChangeCalled).to.be.true;
            scope.vm.selectionChangeCalled = false;
            var checkboxes = elements.rows.find('input[type=checkbox]');
            checkboxes[0].click();
            expect(scope.vm.selectionChangeCalled).to.be.true;

            scope.vm.selectionChangeCalled = false;
            checkboxes[0].click();
            expect(scope.vm.selectionChangeCalled).to.be.true;
        });

        it('should trigger the onRowSelect callback (if set)', function() {
            var el = selectable();
            var elements = getElements(el);
            var checkboxes = elements.rows.find('input[type=checkbox]');
            checkboxes[0].click();
            expect(scope.vm.rowSelectCalled).to.be.true;
            expect(scope.vm.selectedRow).to.eql(scope.data[0]);
        });

        it('should send all selected rows to onSelectionChange callback', function() {
            var el = selectable();
            var elements = getElements(el);
            var selectAllCheckbox = elements.thead.find('input[type=checkbox]');
            selectAllCheckbox[0].click();
            expect(scope.vm.selectedRows.length).to.equal(scope.data.length);
        });

        it('should bind header to scope if required', function() {
            var el = compile(mock.html.selectableBindHeader);
            scope.data = data;
            scope.vm = {
                onNameHeaderClick: sinon.stub()
            };
            scope.$digest();
            var nameButton = el.find('.nameButton');
            expect(nameButton.length).to.equal(1);
            nameButton.click();
            expect(scope.vm.onNameHeaderClick.called).to.be.true;
        });

        describe('selection toolbar', function() {

            it('it should render toolbar if provided', function() {
                var el = selectable();
                var elements = getElements(el);
                expect(elements.toolbar.length).to.equal(1);
            });

            it('it should show toolbar when items are selected', function() {
                var el = selectable();
                var elements = getElements(el);
                var selectAllCheckbox = elements.thead.find('input[type=checkbox]');
                selectAllCheckbox[0].click();
                expect(elements.toolbar.hasClass('ng-hide')).to.be.false;
            });

            it('it should hide toolbar when no items are selected', function() {
                var el = selectable();
                var elements = getElements(el);
                expect(elements.toolbar.hasClass('ng-hide')).to.be.true;
                var selectAllCheckbox = elements.thead.find('input[type=checkbox]');
                selectAllCheckbox[0].click();
                expect(elements.toolbar.hasClass('ng-hide')).to.be.false;
                selectAllCheckbox[0].click();
                expect(elements.toolbar.hasClass('ng-hide')).to.be.true;
            });
        });
    });

    describe('with actions', function() {

        function withCustomActions() {
            var el = compile(mock.html.customActions);
            scope.data = data;
            scope.vm = scope.vm || {};
            scope.vm.actionOneClicked = sinon.stub();
            scope.vm.actionTwoClicked = sinon.stub();
            scope.vm.actionThreeClicked = sinon.stub();
            scope.vm.allowActionThree = false;
            scope.$digest();
            return el;
        }

        function withCloneArchiveDelete() {
            var el = compile(mock.html.actionsCloneArchiveDelete);
            scope.data = data;
            scope.vm = scope.vm || {};
            var clonedId = 999;
            function getClonedId() {
                clonedId += 1;
                return clonedId;
            }
            scope.vm.clone = function(row) {
                var clone = angular.copy(row);
                clone.id = getClonedId();
                return mockPromise(clone);
            };
            scope.vm.archive = function() {
                return mockPromise(true);
            };
            scope.vm.delete = function() {
                return mockPromise(true);
            };
            scope.vm.selectedRows = [];
            scope.vm.onSelectionChange = function(selectedRows) {
                scope.vm.selectedRows = selectedRows;
            };
            scope.$digest();
            return el;
        }

        it('should render custom actions', function() {
            var el = withCustomActions();
            var elements = getElements(el);

            var actionTemplates = elements.rows.find('.actions');
            expect(actionTemplates.length).to.equal(3);
            var actions = actionTemplates.find('a');
            expect(actions.length).to.equal(6);
        });

        it('should show action if allow = true', function() {
            var el = withCustomActions();
            var elements = getElements(el);

            var actionTemplates = elements.rows.find('.actions');
            expect(actionTemplates.length).to.equal(3);
            var actions = actionTemplates.find('a');
            expect(actions.length).to.equal(6);
            scope.vm.allowActionThree = true;
            scope.$digest();
            elements = getElements(el);
            actionTemplates = elements.rows.find('.actions');
            actions = actionTemplates.find('a');
            expect(actions.length).to.equal(9);
        });

        it('should call custom action callbacks', function() {
            var el = withCustomActions();
            var elements = getElements(el);
            var actionTemplate = elements.firstRow.find('.actions');

            var actionOne = actionTemplate.find('a');
            var actionTwo = actionTemplate.find('a');

            actionOne.click();
            actionTwo.click();

            expect(scope.vm.actionOneClicked.called).to.be.true;
            expect(scope.vm.actionTwoClicked.called).to.be.true;
        });

        describe('when cloning (parent)', function() {
            it('should add the clone immediately below and highlight it', function() {
                var el = withCloneArchiveDelete();
                var elements = getElements(el);
                expect(elements.rows.length).to.equal(3);
                var actionTemplate = elements.firstRow.find('.actions');
                expect(actionTemplate.length).to.equal(1);
                var cloneAction = actionTemplate.find('.st-clone');
                expect(cloneAction.length).to.equal(1);
                cloneAction.click();
                $timeout.flush();
                elements = getElements(el);
                expect(elements.rows.length).to.equal(4);
                var clonedRow = elements.getRow(1);
                expect(clonedRow.find('.name').html()).to.eql(elements.getRow(1).find('.name').html());
                expect(clonedRow.hasClass('highlight')).to.be.true;
                expect(clonedRow.attr('data-row-id')).to.equal('1000');
                $timeout.flush();
                expect(clonedRow.hasClass('highlight')).to.be.false;

            });
        });

        describe('when archiving (parent)', function() {
            it('should remove the archived row from the table', function() {
                var el = withCloneArchiveDelete();
                var elements = getElements(el);
                expect(elements.rows.length).to.equal(3);
                var actionTemplate = elements.firstRow.find('.actions');
                expect(actionTemplate.length).to.equal(1);
                var archiveAction = actionTemplate.find('.st-archive');
                expect(archiveAction.length).to.equal(1);
                archiveAction.click();
                elements = getElements(el);
                expect(elements.rows.length).to.equal(2);
            });
            it('should update selected rows if deleted row was selected ', function() {
                var el = withCloneArchiveDelete();
                var elements = getElements(el);
                expect(elements.rows.length).to.equal(3);
                var selectAllCheckbox = elements.thead.find('input[type=checkbox]');
                selectAllCheckbox[0].click();
                expect(scope.vm.selectedRows.length).to.equal(3);
                var actionTemplate = elements.firstRow.find('.actions');
                expect(actionTemplate.length).to.equal(1);
                var archiveAction = actionTemplate.find('.st-archive');
                expect(archiveAction.length).to.equal(1);
                archiveAction.click();
                elements = getElements(el);
                expect(elements.rows.length).to.equal(2);
                expect(scope.vm.selectedRows.length).to.equal(2);
            });
        });

        describe('when deleting (parent)', function() {
            it('should remove the deleted row from the table', function() {
                var el = withCloneArchiveDelete();
                var elements = getElements(el);
                expect(elements.rows.length).to.equal(3);
                var actionTemplate = elements.firstRow.find('.actions');
                expect(actionTemplate.length).to.equal(1);
                var deleteAction = actionTemplate.find('.st-delete');
                expect(deleteAction.length).to.equal(1);
                deleteAction.click();
                elements = getElements(el);
                expect(elements.rows.length).to.equal(2);
            });
            it('should update selected rows if deleted row was selected ', function() {
                var el = withCloneArchiveDelete();
                var elements = getElements(el);
                expect(elements.rows.length).to.equal(3);
                var selectAllCheckbox = elements.thead.find('input[type=checkbox]');
                selectAllCheckbox[0].click();
                expect(scope.vm.selectedRows.length).to.equal(3);
                var actionTemplate = elements.firstRow.find('.actions');
                expect(actionTemplate.length).to.equal(1);
                var deleteAction = actionTemplate.find('.st-delete');
                expect(deleteAction.length).to.equal(1);
                deleteAction.click();
                elements = getElements(el);
                expect(elements.rows.length).to.equal(2);
                expect(scope.vm.selectedRows.length).to.equal(2);
            });
        });
    });

    describe('when expandable', function() {
        function expandable() {
            var el = compile(mock.html.expandable);
            scope.data = data;
            scope.vm = scope.vm || {};
            scope.vm.getChildren = service.getChildren;
            scope.vm.onParentClick = sinon.stub();
            scope.vm.onChildClick = sinon.stub();
            scope.vm.selectedRows = [];
            scope.vm.selectionChangeCalled = false;
            scope.vm.onSelectionChange = function(selectedRows) {
                scope.vm.selectedRows = selectedRows;
                scope.vm.selectionChangeCalled = true;
            };
            scope.$digest();
            var elements = getElements(el);
            expect(elements.rows.length).to.equal(3);
            return el;
        }

        function expandableCache() {
            var el = compile(mock.html.expandableCache);
            scope.data = data;
            scope.vm = scope.vm || {};
            scope.vm.cacheChildren = true;
            scope.vm.backendCalled = false;
            scope.vm.getChildren = function(key) {
                scope.vm.backendCalled = true;
                return service.getChildren(key);
            };
            scope.$digest();
            return el;
        }

        function expandableParentChildTemplates() {
            var el = compile(mock.html.expandableParentChildTemplates);
            scope.data = data;
            scope.vm = scope.vm || {};
            scope.vm.getChildren = service.getChildren;
            scope.$digest();
            return el;
        }

        function expandableWithCloneArchiveDelete() {
            var el = compile(mock.html.expandableWithCloneArchiveDelete);
            scope.data = data;
            scope.vm = scope.vm || {};
            scope.vm.getChildren = service.getChildren;
            scope.vm.selectedRows = [];
            scope.vm.selectionChangeCalled = false;
            scope.vm.onSelectionChange = function(selectedRows) {
                scope.vm.selectedRows = selectedRows;
                scope.vm.selectionChangeCalled = true;
            };
            scope.vm.clone = function(row) {
                return mockPromise(angular.copy(row));
            };
            scope.vm.archive = function() {
                return mockPromise(true);
            };
            scope.vm.delete = function() {
                return mockPromise(true);
            };
            scope.$digest();
            var elements = getElements(el);
            expect(elements.rows.length).to.equal(3);
            return el;
        }
        function expandFirstRow(el) {
            var elements = getElements(el);
            expect(elements.rows.length).to.equal(3);
            elements.firstRow.click();
            elements = getElements(el);
            expect(elements.rows.length).to.equal(5);
        }
        function expandSecondRow(el) {
            var elements = getElements(el);
            expect(elements.rows.length).to.equal(3);
            elements.getRow(1).click();
            elements = getElements(el);
            expect(elements.rows.length).to.equal(6);
        }

        it('should render expand column', function() {
            var el = expandable();
            var elements = getElements(el);
            expect(elements.table.length).to.equal(1);
            expect(elements.thead.length).to.equal(1);
            expect(elements.theadRow.length).to.equal(1);
            expect(elements.th.length).to.equal(5);
            expect(elements.tbody.length).to.equal(1);
            expect(elements.rows.length).to.equal(3);
            expect(elements.cells.length).to.equal(15);

            var expandableCells = elements.rows.find('td.expand');
            expect(expandableCells.length).to.equal(3);
            var expandButtons = expandableCells.find('i.fa-plus');
            expect(expandButtons.length).to.equal(3);
        });

        it('should fire onParentClick callback (if set) when parent clicked', function() {
            var el = expandable();
            var elements = getElements(el);
            var parentRow = elements.getRow(0);
            expect(parentRow.hasClass('parent-row')).to.be.true;
            parentRow.click();
            expect(scope.vm.onParentClick.called).to.be.true;
        });

        describe('when collapsed', function() {
            it('should expand to show children after clicking parent row', function() {
                var el = expandable();
                expandFirstRow(el);
                var elements = getElements(el);
                expect(elements.getRow(0).hasClass('parent-row')).to.be.true;
                expect(elements.getRow(1).hasClass('child-row')).to.be.true;
                expect(elements.getRow(1).hasClass('first-child')).to.be.true;
                expect(elements.getRow(2).hasClass('child-row')).to.be.true;
                expect(elements.getRow(2).hasClass('last-child')).to.be.true;
                expect(elements.getRow(3).hasClass('parent-row')).to.be.true;
                expect(elements.getRow(4).hasClass('parent-row')).to.be.true;

                elements.getRow(3).click();
                elements = getElements(el);
                expect(elements.rows.length).to.equal(8);
                expect(elements.getRow(0).hasClass('parent-row')).to.be.true;
                expect(elements.getRow(1).hasClass('child-row')).to.be.true;
                expect(elements.getRow(2).hasClass('child-row')).to.be.true;
                expect(elements.getRow(3).hasClass('parent-row')).to.be.true;
                expect(elements.getRow(4).hasClass('child-row')).to.be.true;
                expect(elements.getRow(4).hasClass('first-child')).to.be.true;
                expect(elements.getRow(5).hasClass('child-row')).to.be.true;
                expect(elements.getRow(6).hasClass('child-row')).to.be.true;
                expect(elements.getRow(6).hasClass('last-child')).to.be.true;
                expect(elements.getRow(7).hasClass('parent-row')).to.be.true;
            });
        });

        describe('when expanding', function() {

            describe('cache children', function() {
                it('when true should load children from cache after first call', function() {
                    var el = expandableCache();
                    expandFirstRow(el);
                    var elements = getElements(el);
                    expect(elements.rows.length).to.equal(5);
                    expect(scope.vm.backendCalled).to.be.true;
                    scope.vm.backendCalled = false;
                    //collapse
                    elements.firstRow.click();
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(3);
                    //expand again
                    elements.firstRow.click();
                    $timeout.flush();
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(5);
                    expect(scope.vm.backendCalled).to.be.false;
                });

                it('when false should always load children from backend', function() {
                    var el = expandableCache();
                    scope.vm.cacheChildren = false;
                    scope.$digest();
                    expandFirstRow(el);
                    var elements = getElements(el);
                    expect(elements.rows.length).to.equal(5);
                    expect(scope.vm.backendCalled).to.be.true;
                    scope.vm.backendCalled = false;
                    //collapse
                    elements.firstRow.click();
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(3);
                    //expand again
                    elements.firstRow.click();
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(5);
                    expect(scope.vm.backendCalled).to.be.true;
                });
            });

            describe('when selectable', function() {
                it('should select all children when parent is selected', function() {
                    /*  Different from 'when expanded' in that the parent checkbox
                        is clicked *before* expanding, and we expect the newly loaded
                        children to be auto-selected */
                    var el = expandable();
                    var elements = getElements(el);
                    var parentCheckbox = angular.element(elements.rows[0]).find('input[type=checkbox]');
                    expect(scope.vm.selectedRows.length).to.equal(0);
                    parentCheckbox.click();
                    expect(scope.vm.selectedRows.length).to.equal(1);
                    expandFirstRow(el);
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(5);
                    expect(scope.vm.selectedRows.length).to.equal(3);
                });
            });

            describe('when clicking an editable input', function() {

                function editable() {
                    var el = compile(mock.html.editable);
                    scope.data = data;
                    scope.vm = scope.vm || {};
                    scope.vm.getChildren = sinon.stub();
                    scope.vm.onParentClick = sinon.stub();
                    scope.vm.onChildClick = sinon.stub();
                    scope.vm.onRowClick = sinon.stub();
                    scope.$digest();
                    var elements = getElements(el);
                    expect(elements.rows.length).to.equal(3);
                    return el;
                }

                it('should not expand row', function() {
                    var el = editable();
                    var elements = getElements(el);
                    var editableElement = elements.firstRow.find('.editable');
                    editableElement.click();
                    expect(scope.vm.getChildren.called).to.be.false;
                });

                it('should not fire click events', function() {
                    var el = editable();
                    var elements = getElements(el);
                    var editableElement = elements.firstRow.find('.editable');
                    editableElement.click();
                    expect(scope.vm.onParentClick.called).to.be.false;
                    expect(scope.vm.onRowClick.called).to.be.false;
                });
            });
        });

        describe('when expanded', function() {
            it('should collapse to hide children after clicking parent row', function() {
                var el = expandable();
                expandFirstRow(el);
                var elements = getElements(el);
                elements.firstRow.click(); //collapse
                elements = getElements(el);
                expect(elements.rows.length).to.equal(3);
                expect(elements.getRow(0).hasClass('parent-row')).to.be.true;
                expect(elements.getRow(1).hasClass('parent-row')).to.be.true;
                expect(elements.getRow(2).hasClass('parent-row')).to.be.true;
            });

            it('should fire onChildClick callback (if set) when child clicked', function() {
                var el = expandable();
                expandFirstRow(el);
                var elements = getElements(el);
                var childRow = elements.getRow(1);
                expect(childRow.hasClass('child-row')).to.be.true;
                childRow.click();
                expect(scope.vm.onChildClick.called).to.be.true;
            });
            describe('should expose api', function() {
                it('to allow rows to be expanded / collapsed', function() {
                    var el = expandable();
                    var elements = getElements(el);
                    function getNames() {
                        var names = [];
                        elements.rows.map(function(i) {
                            var row = elements.getRow(i);
                            var name = row.find('span')[0].innerHTML;
                            names.push(name);
                        });
                        return names;
                    }
                    expect(getNames()).to.eql(['John', 'Jim', 'Jane']);
                    expect(scope.data[0].st.api.isExpanded()).to.be.false;
                    scope.data[0].st.api.expand();
                    scope.$digest();
                    expect(scope.data[0].st.api.isExpanded()).to.be.true;
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(5);
                    expect(getNames()).to.eql(['John', 'Alice', 'Joan', 'Jim', 'Jane']);
                    expect(scope.data[0].st.api.isExpanded()).to.be.true;

                    scope.data[0].st.api.collapse();
                    scope.$digest();
                    expect(scope.data[0].st.api.isExpanded()).to.be.false;
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(3);
                    expect(getNames()).to.eql(['John', 'Jim', 'Jane']);
                    expect(scope.data[0].st.api.isExpanded()).to.be.false;
                });

                it('to allow children to be refreshed', function() {
                    var el = expandable();
                    var elements = getElements(el);
                    function getNames() {
                        var names = [];
                        elements.rows.map(function(i) {
                            var row = elements.getRow(i);
                            var name = row.find('span')[0].innerHTML;
                            names.push(name);
                        });
                        return names;
                    }
                    expect(getNames()).to.eql(['John', 'Jim', 'Jane']);
                    expandFirstRow(el);
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(5);
                    expect(getNames()).to.eql(['John', 'Alice', 'Joan', 'Jim', 'Jane']);

                    //change one of the children's name
                    mock.children[1][0].name = 'Alicia';
                    scope.data[0].st.api.refreshChildren();
                    $timeout.flush();
                    scope.$digest();
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(5);
                    expect(getNames()).to.eql(['John', 'Alicia', 'Joan', 'Jim', 'Jane']);

                    //add a couple of new children
                    mock.children[1].push({id: 20, name: 'Benedict', type: 'Child', age: 6, country: 'Venezuala'});
                    mock.children[1].push({id: 21, name: 'Rose', type: 'Child', age: 4, country: 'England'});
                    scope.data[0].st.api.refreshChildren();
                    $timeout.flush();
                    scope.$digest();
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(7);
                    expect(getNames()).to.eql(['John', 'Alicia', 'Joan', 'Benedict', 'Rose', 'Jim', 'Jane']);

                    //restore
                    mock.children[1][0].name = 'Alice';
                    mock.children[1].pop();
                    mock.children[1].pop();
                });
            });

            it('shoud render different templates for parent / child if specified', function() {
                var el = expandableParentChildTemplates();
                expandFirstRow(el);
                var elements = getElements(el);
                expect(elements.getRow(0).hasClass('parent-row')).to.be.true;
                expect(elements.getRow(0).find('.parentTemplate').length).to.equal(1);
                expect(elements.getRow(0).find('.childTemplate').length).to.equal(0);
                expect(elements.getRow(1).hasClass('child-row')).to.be.true;
                expect(elements.getRow(1).find('.childTemplate').length).to.equal(1);
                expect(elements.getRow(1).find('.parentTemplate').length).to.equal(0);
                expect(elements.getRow(2).hasClass('child-row')).to.be.true;
                expect(elements.getRow(2).find('.childTemplate').length).to.equal(1);
                expect(elements.getRow(2).find('.parentTemplate').length).to.equal(0);
                expect(elements.getRow(3).hasClass('parent-row')).to.be.true;
                expect(elements.getRow(3).find('.parentTemplate').length).to.equal(1);
                expect(elements.getRow(3).find('.childTemplate').length).to.equal(0);
                expect(elements.getRow(4).hasClass('parent-row')).to.be.true;
                expect(elements.getRow(4).find('.parentTemplate').length).to.equal(1);
                expect(elements.getRow(4).find('.childTemplate').length).to.equal(0);
            });

            describe('with actions', function() {
                it('should show parent actions only on parent rows', function() {
                    var el = expandable();
                    expandSecondRow(el);
                    var elements = getElements(el);
                    var actionTemplate = elements.rows.find('.actions');
                    expect(actionTemplate.length).to.equal(6);

                    var parentRow = elements.getRow(1);
                    expect(parentRow.hasClass('parent-row')).to.be.true;
                    var parentActions = parentRow.find('.actions a');
                    expect(parentActions.length).to.equal(3);
                    expect(parentActions[0].innerHTML).to.equal('action');
                    expect(parentActions[1].innerHTML).to.equal('parent action one');
                    expect(parentActions[2].innerHTML).to.equal('parent action two');

                });
                it('should show child actions only on child rows', function() {
                    var el = expandable();
                    expandSecondRow(el);
                    var elements = getElements(el);
                    var actionTemplate = elements.rows.find('.actions');
                    expect(actionTemplate.length).to.equal(6);

                    var childRow = elements.getRow(2);
                    var childActions = childRow.find('.actions a');
                    expect(childActions.length).to.equal(2);
                    expect(childActions[0].innerHTML).to.equal('action');
                    expect(childActions[1].innerHTML).to.equal('child action');
                });
            });

            describe('when selectable', function() {

                function getSelectedParents() {
                    return scope.vm.selectedRows.filter(function(item) {
                        return item.type === 'Parent';
                    });
                }
                it('should select all children when parent is selected', function() {
                    var el = expandable();
                    var elements = getElements(el);
                    var parentCheckbox = angular.element(elements.rows[0]).find('input[type=checkbox]');
                    expect(scope.vm.selectedRows.length).to.equal(0);
                    expandFirstRow(el);
                    expect(scope.vm.selectedRows.length).to.equal(0);
                    parentCheckbox.click();
                    expect(scope.vm.selectedRows.length).to.equal(3);
                });

                it('should deselect the parent if any child is deselected', function() {
                    var el = expandable();
                    var elements = getElements(el);
                    var parentCheckbox = angular.element(elements.rows[0]).find('input[type=checkbox]');
                    expandFirstRow(el);
                    parentCheckbox.click();
                    expect(scope.vm.selectedRows.length).to.equal(3);
                    expect(getSelectedParents().length).to.equal(1);
                    elements = getElements(el);
                    var childCheckbox = angular.element(elements.rows[1]).find('input[type=checkbox]');
                    childCheckbox.click();
                    expect(getSelectedParents().length).to.equal(0);
                    expect(scope.vm.selectedRows.length).to.equal(1);
                });

                it('should select the parent if all children are selected', function() {
                    var el = expandable();
                    expandFirstRow(el);
                    expect(scope.vm.selectedRows.length).to.equal(0);
                    expect(getSelectedParents().length).to.equal(0);
                    var elements = getElements(el);
                    var childCheckbox1 = angular.element(elements.rows[1]).find('input[type=checkbox]');
                    var childCheckbox2 = angular.element(elements.rows[2]).find('input[type=checkbox]');
                    childCheckbox1.click();
                    childCheckbox2.click();
                    expect(getSelectedParents().length).to.equal(1);
                    expect(scope.vm.selectedRows.length).to.equal(3);
                });

                it('should be able to select/deselect all rows including children', function() {
                    var el = expandable();
                    expandFirstRow(el);
                    var elements = getElements(el);
                    expect(scope.vm.selectedRows.length).to.equal(0);
                    var selectAllCheckbox = elements.thead.find('input[type=checkbox]');
                    expect(selectAllCheckbox.length).to.equal(1);
                    selectAllCheckbox[0].click();
                    expect(scope.vm.selectedRows.length).to.equal(5);
                    selectAllCheckbox[0].click();
                    expect(scope.vm.selectedRows.length).to.equal(0);
                });
            });

            describe('when cloning (expanded parent)', function() {
                it('should add the clone below its children and highlight it', function() {
                    var el = expandableWithCloneArchiveDelete();
                    var elements = getElements(el);
                    expect(elements.rows.length).to.equal(3);
                    expandSecondRow(el);
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(6);
                    var parentRow = elements.getRow(1);
                    expect(parentRow.hasClass('parent-row')).to.be.true;
                    var actionTemplate = parentRow.find('.actions');
                    expect(actionTemplate.length).to.equal(1);
                    var cloneAction = actionTemplate.find('.st-clone');
                    expect(cloneAction.length).to.equal(1);
                    cloneAction.click();
                    $timeout.flush();
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(7);
                    var clonedRow = elements.getRow(5);
                    expect(clonedRow.hasClass('highlight')).to.be.true;
                    var origName = parentRow.find('td')[2].innerHTML;
                    var clonedName = clonedRow.find('td')[2].innerHTML;
                    expect(origName).to.equal(clonedName);
                });
            });

            describe('when cloning (child)', function() {
                it('should add the clone immediately below the item to be cloned and highlight it', function() {
                    var el = expandableWithCloneArchiveDelete();
                    var elements = getElements(el);
                    expect(elements.rows.length).to.equal(3);
                    expandSecondRow(el);
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(6);
                    var childRow = elements.getRow(3);
                    expect(childRow.hasClass('child-row')).to.be.true;
                    expect(childRow.hasClass('first-child')).to.be.false;
                    var actionTemplate = childRow.find('.actions');
                    expect(actionTemplate.length).to.equal(1);
                    var cloneAction = actionTemplate.find('.st-clone');
                    expect(cloneAction.length).to.equal(1);
                    cloneAction.click();
                    $timeout.flush();
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(7);
                    var clonedRow = elements.getRow(4);
                    expect(clonedRow.hasClass('highlight')).to.be.true;
                    var origName = childRow.find('td')[2].innerHTML;
                    var clonedName = clonedRow.find('td')[2].innerHTML;
                    expect(origName).to.equal(clonedName);
                });

                it('when cloning last child the newly cloned row becomes the last child', function() {
                    var el = expandableWithCloneArchiveDelete();
                    var elements = getElements(el);
                    expect(elements.rows.length).to.equal(3);
                    expandSecondRow(el);
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(6);
                    var lastChild = elements.getRow(4);
                    expect(lastChild.hasClass('child-row')).to.be.true;
                    expect(lastChild.hasClass('last-child')).to.be.true;
                    expect(elements.getRow(5).hasClass('parent-row')).to.be.true;
                    actionTemplate = lastChild.find('.actions');
                    expect(actionTemplate.length).to.equal(1);
                    cloneAction = actionTemplate.find('.st-clone');
                    expect(cloneAction.length).to.equal(1);
                    cloneAction.click();
                    $timeout.flush();
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(7);
                    expect(elements.getRow(5).hasClass('last-child')).to.be.true;
                    expect(elements.table.find('tr.last-child').length).to.equal(1);
                });
            });

            describe('when archiving (child)', function() {
                it('should remove the archived row from the table', function() {
                    var el = expandableWithCloneArchiveDelete();
                    var elements = getElements(el);
                    expect(elements.rows.length).to.equal(3);
                    expandSecondRow(el);
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(6);
                    var childRow = elements.getRow(3);
                    expect(childRow.hasClass('child-row')).to.be.true;
                    var actionTemplate = childRow.find('.actions');
                    expect(actionTemplate.length).to.equal(1);
                    var archiveAction = actionTemplate.find('.st-archive');
                    expect(archiveAction.length).to.equal(1);
                    archiveAction.click();
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(5);
                });
            });
            describe('when deleting (child)', function() {
                it('should remove the deleted row from the table', function() {
                    var el = expandableWithCloneArchiveDelete();
                    var elements = getElements(el);
                    expect(elements.rows.length).to.equal(3);
                    expandSecondRow(el);
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(6);
                    var childRow = elements.getRow(3);
                    expect(childRow.hasClass('child-row')).to.be.true;
                    var actionTemplate = childRow.find('.actions');
                    expect(actionTemplate.length).to.equal(1);
                    var deleteAction = actionTemplate.find('.st-delete');
                    expect(deleteAction.length).to.equal(1);
                    deleteAction.click();
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(5);
                });

                it('when all children have been removed the row is no longer expanded', function() {
                    var el = expandableWithCloneArchiveDelete();
                    var elements = getElements(el);
                    expect(elements.rows.length).to.equal(3);
                    expect(elements.firstRow.hasClass('expanded')).to.be.false;
                    expandFirstRow(el);
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(5);
                    expect(elements.firstRow.hasClass('expanded')).to.be.true;

                    function deleteFirstChild() {
                        var childRow = elements.getRow(1);
                        expect(childRow.hasClass('child-row')).to.be.true;
                        var actionTemplate = childRow.find('.actions');
                        expect(actionTemplate.length).to.equal(1);
                        var deleteAction = actionTemplate.find('.st-delete');
                        expect(deleteAction.length).to.equal(1);
                        deleteAction.click();
                    }

                    deleteFirstChild();
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(4);
                    expect(elements.firstRow.hasClass('expanded')).to.be.true;

                    deleteFirstChild();
                    elements = getElements(el);
                    expect(elements.rows.length).to.equal(3);
                    expect(elements.firstRow.hasClass('expanded')).to.be.false;
                });
            });

        });
    });

    describe('when sorting', function() {
        it('Should Render sorting arrows header', function() {
            var el;
            var elements;
            var headerSortable;

            el = compile(mock.html.sortableColumns);
            scope.data = data;
            scope.vm = {
                loaded: true,
                sortKey: 'name',
                sortDirection: 'DESC',
                onHeaderClicked: angular.noop
            };
            scope.$digest();
            elements = getElements(el);
            headerSortable = elements.th.find('.sort-icon');

            expect(elements.th.length).to.equal(3);
            expect(elements.cells.length).to.equal(9);
            expect(headerSortable.length).to.equal(3);
        });

        it('Should invoke sort callback onclick with correct header, and update DOM header classes', function() {
            var el;
            var elements;
            var headerSortable;

            el = compile(mock.html.sortableColumns);
            scope.data = data;
            scope.vm = {
                loaded: true,
                sortKey: 'name',
                sortDirection: 'DESC',
                onHeaderClicked: angular.noop
            };
            sinon.spy(scope.vm, 'onHeaderClicked');
            scope.$digest();
            elements = getElements(el);

            headerSortableName = elements.th.find('.sort-icon').first();

            headerSortableName.trigger('click');
            expect(scope.vm.onHeaderClicked.calledWith('name')).to.be.true();

            sinon.restore(scope.vm.onHeaderClicked);
        });

        it('Should invoke sort callback onclick with correct header, and update DOM header classes', function() {
            var el;
            var elements;
            var headerSortable;

            el = compile(mock.html.sortableColumns);
            scope.data = data;
            scope.vm = {
                loaded: true,
                sortKey: 'name',
                sortDirection: 'DESC',
                onHeaderClicked: function(headerKey) {
                    scope.data = scope.data.reverse();
                    scope.vm.sortDirection = 'ASC';
                    scope.vm.sortKey = headerKey;
                }
            };
            scope.$digest();
            elements = getElements(el);
            headerSortableName = elements.th.find('.sort-icon').first();
            expect(headerSortableName.attr('class').indexOf('ASC')).to.equal(-1);
            headerSortableName.trigger('click');

            scope.$digest();
            expect(headerSortableName.attr('class').indexOf('ASC')).not.to.equal(-1);
            expect(headerSortableName.attr('class').indexOf('active')).not.to.equal(-1);
        });

        it('Should switch active and desc/asc classes when new header is clicked', function() {
            var el;
            var elements;
            var headerSortable;

            el = compile(mock.html.sortableColumns);
            scope.data = data;
            scope.vm = {
                loaded: true,
                sortKey: 'name',
                sortDirection: 'DESC',
                onHeaderClicked: function(headerKey) {
                    scope.data = scope.data.reverse();
                    scope.vm.sortDirection = 'ASC';
                    scope.vm.sortKey = headerKey;
                }
            };
            scope.$digest();
            elements = getElements(el);

            headerSortableName = elements.th.find('.sort-icon').first();
            headerSortableAge = elements.table.find('th.age .sort-icon');

            expect(headerSortableName.attr('class').indexOf('ASC')).to.equal(-1);
            expect(headerSortableAge.attr('class').indexOf('ASC')).to.equal(-1);

            headerSortableAge.trigger('click');

            scope.$digest();

            expect(headerSortableAge.attr('class').indexOf('ASC')).not.to.equal(-1);
            expect(headerSortableAge.attr('class').indexOf('active')).not.to.equal(-1);
            expect(headerSortableName.attr('class').indexOf('active')).to.equal(-1);
        });
    });
});
