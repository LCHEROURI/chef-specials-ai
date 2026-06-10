import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { createFolder, getFolders } from "../folders/folder-api";
import { createTag, getTags } from "./organization-api";

type OrganizationPickerProps = {
  folderIds: string[];
  onFoldersChange: (ids: string[]) => void;
  onTagsChange: (ids: string[]) => void;
  tagIds: string[];
};

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function OrganizationPicker({
  folderIds,
  onFoldersChange,
  onTagsChange,
  tagIds
}: OrganizationPickerProps) {
  const queryClient = useQueryClient();
  const [folderName, setFolderName] = useState("");
  const [tagName, setTagName] = useState("");
  const folders = useQuery({ queryFn: getFolders, queryKey: ["folders"] });
  const tags = useQuery({ queryFn: getTags, queryKey: ["tags"] });
  const folderMutation = useMutation({
    mutationFn: (folderName: string) => createFolder(folderName),
    onSuccess: async (folder) => {
      onFoldersChange([...folderIds, folder.id]);
      setFolderName("");
      await queryClient.invalidateQueries({ queryKey: ["folders"] });
    }
  });
  const tagMutation = useMutation({
    mutationFn: createTag,
    onSuccess: async (tag) => {
      onTagsChange([...tagIds, tag.id]);
      setTagName("");
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
    }
  });

  return (
    <>
      <fieldset className="organization-picker">
        <legend>Folders</legend>
        <div className="organization-options">
          {folders.data?.map((folder) => (
            <label key={folder.id}>
              <input
                checked={folderIds.includes(folder.id)}
                onChange={() =>
                  onFoldersChange(toggleId(folderIds, folder.id))
                }
                type="checkbox"
              />
              <span
                className="folder-dot"
                style={{ backgroundColor: folder.color }}
              />
              {folder.folder_name}
            </label>
          ))}
        </div>
        <div className="organization-create">
          <input
            aria-label="New folder name"
            onChange={(event) => setFolderName(event.target.value)}
            placeholder="New folder"
            value={folderName}
          />
          <button
            aria-label="Create folder"
            disabled={!folderName.trim() || folderMutation.isPending}
            onClick={() => folderMutation.mutate(folderName)}
            type="button"
          >
            <Plus size={16} />
          </button>
        </div>
      </fieldset>

      <fieldset className="organization-picker">
        <legend>Tags</legend>
        <div className="organization-options organization-options--tags">
          {tags.data?.map((tag) => (
            <label key={tag.id}>
              <input
                checked={tagIds.includes(tag.id)}
                onChange={() => onTagsChange(toggleId(tagIds, tag.id))}
                type="checkbox"
              />
              {tag.name}
            </label>
          ))}
        </div>
        <div className="organization-create">
          <input
            aria-label="New tag name"
            onChange={(event) => setTagName(event.target.value)}
            placeholder="New tag"
            value={tagName}
          />
          <button
            aria-label="Create tag"
            disabled={!tagName.trim() || tagMutation.isPending}
            onClick={() => tagMutation.mutate(tagName)}
            type="button"
          >
            <Plus size={16} />
          </button>
        </div>
      </fieldset>
    </>
  );
}
