import React, { useState } from 'react';
import { Tag, X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  maxTags?: number;
  tagLimitError?: string;
}

export const TagInput: React.FC<TagInputProps> = React.memo(
  ({ tags, onAddTag, onRemoveTag, maxTags = 10, tagLimitError }) => {
    const [newTag, setNewTag] = useState('');

    const handleAddTag = () => {
      const tag = newTag.trim().toLowerCase();
      if (tag && !tags.includes(tag) && tags.length < maxTags) {
        onAddTag(tag);
        setNewTag('');
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && newTag.trim()) {
        e.preventDefault();
        handleAddTag();
      }
    };

    return (
      <div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add a tag..."
            maxLength={20}
            disabled={tags.length >= maxTags}
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={!newTag.trim() || tags.length >= maxTags}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          {tagLimitError || `${tags.length}/${maxTags} tags`}
        </div>
      </div>
    );
  }
);
