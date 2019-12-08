({
    /**
     * Init function for component to load lightning-core library
     *
     * @version 1.0
     * @author github/4an70m
     * @param cmp
     * @param evt
     * @param helper
     */
    doInit: function(cmp, evt, helper) {
        helper.core(cmp).init();
    }
});