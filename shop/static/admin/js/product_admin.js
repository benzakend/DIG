(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Get the category and sub-category select elements
        var categorySelect = $('#id_category');
        var subCategorySelect = $('#id_sub_category');
        
        // Store the original options for sub-category
        var originalSubCategoryOptions = subCategorySelect.find('option').clone();
        
        // Function to update sub-category options based on selected category
        function updateSubCategories() {
            var selectedCategoryId = categorySelect.val();
            
            // Clear current options
            subCategorySelect.empty();
            
            // Add the default "---------" option
            subCategorySelect.append('<option value="">---------</option>');
            
            if (selectedCategoryId) {
                // Fetch sub-categories for the selected category
                $.ajax({
                    url: '/admin/products/product/api/subcategories/' + selectedCategoryId + '/',
                    method: 'GET',
                    success: function(data) {
                        // Add sub-category options
                        data.subcategories.forEach(function(subcategory) {
                            subCategorySelect.append(
                                '<option value="' + subcategory.id + '">' + subcategory.name + '</option>'
                            );
                        });
                        
                        // If this is an edit form, try to restore the previously selected sub-category
                        var currentSubCategoryId = subCategorySelect.data('current-value');
                        if (currentSubCategoryId) {
                            subCategorySelect.val(currentSubCategoryId);
                        }
                    },
                    error: function() {
                        console.error('Failed to fetch sub-categories');
                    }
                });
            }
        }
        
        // Store the current sub-category value if editing
        if (subCategorySelect.val()) {
            subCategorySelect.data('current-value', subCategorySelect.val());
        }
        
        // Bind the change event to category select
        categorySelect.on('change', function() {
            updateSubCategories();
        });
        
        // Initialize on page load
        updateSubCategories();
        
        // Also handle the case when the form is loaded with existing data
        if (categorySelect.val()) {
            updateSubCategories();
        }
    });
    
})(django.jQuery);
