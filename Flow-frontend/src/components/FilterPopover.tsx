import { Filter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterSection {
  title: string;
  type: "checkbox" | "radio";
  options: FilterOption[];
}

interface FilterPopoverProps {
  sections: FilterSection[];
  onApply: (filters: Record<string, string[]>) => void;
}

export function FilterPopover({ sections, onApply }: FilterPopoverProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const handleCheckboxChange = (sectionTitle: string, value: string, checked: boolean) => {
    setSelectedFilters(prev => {
      const sectionFilters = prev[sectionTitle] || [];
      if (checked) {
        return { ...prev, [sectionTitle]: [...sectionFilters, value] };
      } else {
        return { ...prev, [sectionTitle]: sectionFilters.filter(v => v !== value) };
      }
    });
  };

  const handleRadioChange = (sectionTitle: string, value: string) => {
    setSelectedFilters(prev => ({ ...prev, [sectionTitle]: [value] }));
  };

  const handleApply = () => {
    onApply(selectedFilters);
  };

  const handleReset = () => {
    setSelectedFilters({});
    onApply({});
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <h4 className="font-semibold">Filters</h4>
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {sectionIndex > 0 && <Separator className="my-4" />}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{section.title}</Label>
                {section.type === "checkbox" ? (
                  <div className="space-y-2">
                    {section.options.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`${section.title}-${option.value}`}
                          checked={selectedFilters[section.title]?.includes(option.value) || false}
                          onCheckedChange={(checked) => handleCheckboxChange(section.title, option.value, checked as boolean)}
                        />
                        <label
                          htmlFor={`${section.title}-${option.value}`}
                          className="text-sm cursor-pointer"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <RadioGroup
                    onValueChange={(val) => handleRadioChange(section.title, val)}
                    value={selectedFilters[section.title]?.[0]}
                  >
                    {section.options.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem value={option.value} id={`${section.title}-${option.value}`} />
                        <label
                          htmlFor={`${section.title}-${option.value}`}
                          className="text-sm cursor-pointer"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>
            </div>
          ))}
          <Separator className="my-4" />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <Button className="flex-1" size="sm" onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
