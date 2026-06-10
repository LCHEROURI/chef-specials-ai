import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Folder as FolderIcon, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import {
  createFolder,
  deleteFolder,
  getFolders,
  updateFolder,
  type Folder
} from "./folder-api";

export function FolderManager() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const folders = useQuery({ queryFn: getFolders, queryKey: ["folders"] });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["folders"] });
  const createMutation = useMutation({
    mutationFn: (folderName: string) => createFolder(folderName),
    onSuccess: async () => {
      setAdding(false);
      setName("");
      await refresh();
    }
  });
  const updateMutation = useMutation({
    mutationFn: ({
      folder,
      updates
    }: {
      folder: Folder;
      updates: Pick<Folder, "color" | "folder_name">;
    }) => updateFolder(folder.id, updates),
    onSuccess: async () => {
      setEditingId(null);
      await refresh();
    }
  });
  const deleteMutation = useMutation({
    mutationFn: deleteFolder,
    onSuccess: refresh
  });

  return (
    <div className="sidebar-folders">
      <div className="sidebar-section-label">Folders</div>
      {folders.data?.map((folder) =>
        editingId === folder.id ? (
          <div className="sidebar-folder-edit" key={folder.id}>
            <input
              aria-label={`Rename ${folder.folder_name}`}
              onChange={(event) => setEditName(event.target.value)}
              value={editName}
            />
            <input
              aria-label={`Color for ${folder.folder_name}`}
              onChange={(event) =>
                updateMutation.mutate({
                  folder,
                  updates: {
                    color: event.target.value,
                    folder_name: editName || folder.folder_name
                  }
                })
              }
              type="color"
              value={folder.color}
            />
            <button
              aria-label="Save folder"
              onClick={() =>
                updateMutation.mutate({
                  folder,
                  updates: { color: folder.color, folder_name: editName }
                })
              }
              type="button"
            >
              <Check size={15} />
            </button>
            <button
              aria-label="Cancel editing folder"
              onClick={() => setEditingId(null)}
              type="button"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="sidebar-folder-row" key={folder.id}>
            <span
              className="folder-dot"
              style={{ backgroundColor: folder.color }}
            />
            <span>{folder.folder_name}</span>
            <button
              aria-label={`Edit ${folder.folder_name}`}
              onClick={() => {
                setEditingId(folder.id);
                setEditName(folder.folder_name);
              }}
              type="button"
            >
              <Pencil size={14} />
            </button>
            <button
              aria-label={`Delete ${folder.folder_name}`}
              onClick={() => {
                if (window.confirm(`Delete the "${folder.folder_name}" folder?`)) {
                  deleteMutation.mutate(folder.id);
                }
              }}
              type="button"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )
      )}
      {folders.data?.length === 0 ? (
        <div className="sidebar-folder-empty">
          <FolderIcon size={16} /> No folders yet
        </div>
      ) : null}
      {adding ? (
        <form
          className="sidebar-folder-create"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim()) createMutation.mutate(name);
          }}
        >
          <input
            autoFocus
            onChange={(event) => setName(event.target.value)}
            placeholder="Folder name"
            value={name}
          />
          <button aria-label="Create folder" type="submit">
            <Check size={15} />
          </button>
          <button
            aria-label="Cancel new folder"
            onClick={() => setAdding(false)}
            type="button"
          >
            <X size={15} />
          </button>
        </form>
      ) : (
        <button
          className="sidebar-add"
          onClick={() => setAdding(true)}
          type="button"
        >
          <Plus aria-hidden="true" size={18} />
          <span>Add folder</span>
        </button>
      )}
    </div>
  );
}
