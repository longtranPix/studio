
'use client';

import * as React from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Check, ChevronsUpDown, Loader2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type ComboboxItem = { value: string; label: string, record: any };

interface ComboboxProps {
  value: string;
  onValueChange: (value: string, label?: string, record?: any) => void;
  onSearchChange: (search: string) => void;
  initialSearchTerm?: string;
  placeholder: string;
  searchFn: (query: any) => Promise<any[]>;
  createFn?: (name: string) => Promise<any>;
  isInvalid?: boolean;
  disabled?: boolean;
  displayFormatter?: (item: any) => string;
  valueFormatter?: (item: any) => string; // New prop to format the value in the input
}

export function Combobox({
  value,
  onValueChange,
  onSearchChange,
  initialSearchTerm,
  placeholder,
  searchFn,
  createFn,
  isInvalid,
  disabled,
  displayFormatter,
  valueFormatter,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [localItems, setLocalItems] = React.useState<ComboboxItem[]>([]);
  const [isCreating, setIsCreating] = React.useState(false);
  const [localSearchTerm, setLocalSearchTerm] = React.useState('');
  const initialSearchPerformed = React.useRef(false);

  const getLabel = React.useCallback(
    (item: any) => displayFormatter ? displayFormatter(item) : item.fields.name || item.fields.brand_name || item.fields.supplier_name,
    [displayFormatter]
  );

  const getValueLabel = React.useCallback(
    (item: any) => valueFormatter ? valueFormatter(item) : getLabel(item),
    [valueFormatter, getLabel]
  );
  
  const performSearch = React.useCallback(async (query: string, isInitial: boolean = false) => {
    if (query && searchFn) {
        setIsLoading(true);
        try {
            const results = await searchFn(query);
            const mappedResults = (results || []).map(r => ({ value: r.id, label: getLabel(r), record: r }));
            setLocalItems(mappedResults);

            // Auto-select if there is exactly one result from an initial search
            if (isInitial && mappedResults.length === 1) {
                const selected = mappedResults[0];
                onValueChange(selected.value, selected.label, selected.record);
                setLocalSearchTerm(getValueLabel(selected.record));
                setOpen(false); // Close popover on auto-selection
            }
        } catch (error) {
            console.error("Search function failed:", error);
            setLocalItems([]);
        } finally {
            setIsLoading(false);
        }
    } else {
        setLocalItems([]);
    }
  }, [searchFn, onValueChange, getValueLabel, getLabel]);

  React.useEffect(() => {
    // Only perform the initial search once when the component mounts with an initial term
    if (initialSearchTerm && !initialSearchPerformed.current && !value) {
        initialSearchPerformed.current = true;
        setLocalSearchTerm(initialSearchTerm);
        performSearch(initialSearchTerm, true);
    }
  }, [initialSearchTerm, performSearch, value]);


  const debouncedSearch = useDebouncedCallback(async (query: string) => {
      await performSearch(query, false);
  }, 300);

  const handleSearchChange = (search: string) => {
      setLocalSearchTerm(search);
      onSearchChange(search);
      if(value){
          onValueChange(''); // Clear selection when user types
      }
      if (search) {
        debouncedSearch(search);
      } else {
        debouncedSearch.cancel();
        setLocalItems([]);
      }
  }

  const handleCreate = async () => {
    if (!createFn || !localSearchTerm) return;
    setIsCreating(true);
    try {
        const newItem = await createFn(localSearchTerm);
        let createdRecord = null;
        if(newItem && newItem.records && newItem.records.length > 0) {
            createdRecord = newItem.records[0];
        } else if (newItem?.id && newItem?.fields) {
            createdRecord = newItem;
        }

        if (createdRecord) {
            const newId = createdRecord.id;
            const newLabel = getLabel(createdRecord);
            onValueChange(newId, newLabel, createdRecord);
            setLocalSearchTerm(getValueLabel(createdRecord));
            setOpen(false);
        }
    } catch (error) {
        console.error("Create function failed:", error);
    } finally {
        setIsCreating(false);
    }
  }

  const selectedItemLabel = React.useMemo(() => {
    if (value) {
        const selectedItem = localItems.find((item) => item.value === value);
        if (selectedItem) return getValueLabel(selectedItem.record);
    }
    return localSearchTerm;
  }, [localItems, value, localSearchTerm, getValueLabel]);

  const displayValue = value ? selectedItemLabel : localSearchTerm;


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", isInvalid && "border-destructive")}
          disabled={disabled}
        >
          <span className="truncate">
            {displayValue || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ minWidth: 'var(--radix-popover-trigger-width)'}}>
        <Command shouldFilter={false}>
          <CommandInput placeholder={placeholder} onValueChange={handleSearchChange} value={localSearchTerm} />
          <CommandList>
            {isLoading && <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin"/></div>}
            
            {!isLoading && localItems.length === 0 && localSearchTerm && createFn && (
                 <CommandItem
                    onSelect={handleCreate}
                    className="flex items-center gap-2 cursor-pointer"
                    disabled={isCreating}
                >
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4" />}
                    <span>Tạo mới "{localSearchTerm}"</span>
                </CommandItem>
            )}

            {!isLoading && localItems.length === 0 && localSearchTerm && !createFn && (
                <CommandEmpty>Không tìm thấy.</CommandEmpty>
            )}

            <CommandGroup>
              {(localItems || []).map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label} // Use label for filtering in Command
                  onSelect={() => {
                    onValueChange(item.value, item.label, item.record);
                    setLocalSearchTerm(getValueLabel(item.record));
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === item.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
