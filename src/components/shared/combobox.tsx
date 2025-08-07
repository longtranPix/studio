
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
  displayFormatter
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [localItems, setLocalItems] = React.useState<ComboboxItem[]>([]);
  const [isCreating, setIsCreating] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState(initialSearchTerm || '');
  const initialSearchPerformed = React.useRef(false);

  const getLabel = (item: any) => displayFormatter ? displayFormatter(item) : item.fields.name || item.fields.brand_name || item.fields.supplier_name;

  const performSearch = React.useCallback(async (query: string, isInitial: boolean = false) => {
    if (query && searchFn) {
        setIsLoading(true);
        try {
            const results = await searchFn(query);
            const mappedResults = (results || []).map(r => ({ value: r.id, label: getLabel(r), record: r }));
            setLocalItems(mappedResults);

            if (isInitial && mappedResults.length === 1 && !value && initialSearchPerformed.current === false) {
                initialSearchPerformed.current = true;
                onValueChange(mappedResults[0].value, mappedResults[0].label, mappedResults[0].record);
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
  }, [searchFn, onValueChange, value, getLabel]);

  const debouncedSearch = useDebouncedCallback(async (query: string) => {
      await performSearch(query, false);
  }, 300);

  React.useEffect(() => {
    if (initialSearchTerm && !value) {
        performSearch(initialSearchTerm, true);
    }
  }, [initialSearchTerm, performSearch, value]);


  const handleSearchChange = (search: string) => {
      setSearchTerm(search);
      onSearchChange(search);
      if (search) {
        debouncedSearch(search);
      } else {
        debouncedSearch.cancel();
        setLocalItems([]);
      }
  }

  const handleCreate = async () => {
    if (!createFn || !searchTerm) return;
    setIsCreating(true);
    try {
        const newItem = await createFn(searchTerm);
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
      if (selectedItem) return selectedItem.label;
    }
    return searchTerm;
  }, [localItems, value, searchTerm]);


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
            {value && selectedItemLabel ? selectedItemLabel : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ minWidth: 'var(--radix-popover-trigger-width)'}}>
        <Command shouldFilter={false}>
          <CommandInput placeholder={placeholder} onValueChange={handleSearchChange} value={searchTerm} />
          <CommandList>
            {isLoading && <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin"/></div>}
            
            {!isLoading && localItems.length === 0 && searchTerm && createFn && (
                 <CommandItem
                    onSelect={handleCreate}
                    className="flex items-center gap-2 cursor-pointer"
                    disabled={isCreating}
                >
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4" />}
                    <span>Tạo mới "{searchTerm}"</span>
                </CommandItem>
            )}

            {!isLoading && localItems.length === 0 && searchTerm && !createFn && (
                <CommandEmpty>Không tìm thấy.</CommandEmpty>
            )}

            <CommandGroup>
              {(localItems || []).map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label} // Use label for filtering in Command
                  onSelect={() => {
                    onValueChange(item.value, item.label, item.record);
                    setSearchTerm(item.label);
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
