import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';

interface CategoryFilterItemProps {
  category: string;
  subcategories: string[];
  selectedSubcategories: Set<string>;
  onCategoryClick: (category: string) => void;
  onSubcategoryClick: (subcategory: string) => void;
}

export const CategoryFilterItem = ({
  category,
  subcategories,
  selectedSubcategories,
  onCategoryClick,
  onSubcategoryClick,
}: CategoryFilterItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Check if all subcategories are selected
  const allSubcategoriesSelected = subcategories.every(sc => selectedSubcategories.has(sc));
  const someSubcategoriesSelected = subcategories.some(sc => selectedSubcategories.has(sc));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
              <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <Button
            variant={allSubcategoriesSelected ? "secondary" : someSubcategoriesSelected ? "outline" : "ghost"}
            size="sm"
            className="flex-1 justify-start text-left"
            onClick={() => onCategoryClick(category)}
          >
            {category}
          </Button>
        </div>
        
        <CollapsibleContent className="ml-6 space-y-1">
          {subcategories.map(subcategory => (
            <Button
              key={subcategory}
              variant={selectedSubcategories.has(subcategory) ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start text-left text-xs"
              onClick={() => onSubcategoryClick(subcategory)}
            >
              {subcategory}
            </Button>
          ))}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
