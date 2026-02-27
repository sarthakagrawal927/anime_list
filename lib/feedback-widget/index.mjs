// src/FeedbackWidget.tsx
import { useMemo, useState as useState3 } from "react";

// src/api.ts
var DEFAULT_API_BASE = "https://api.saasmaker.dev";
function createApiClient(projectId, apiBaseUrl) {
  const base = (apiBaseUrl || DEFAULT_API_BASE).replace(/\/$/, "");
  return {
    async submitFeedback(data) {
      const res = await fetch(`${base}/v1/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Project-Key": projectId
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async listFeedback(params) {
      const query = new URLSearchParams();
      if (params?.type) query.set("type", params.type);
      if (params?.sort) query.set("sort", params.sort);
      if (params?.page) query.set("page", String(params.page));
      const qs = query.toString();
      const res = await fetch(`${base}/v1/feedback${qs ? `?${qs}` : ""}`, {
        headers: { "X-Project-Key": projectId }
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async uploadImage(file) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${base}/v1/upload`, {
        method: "POST",
        headers: { "X-Project-Key": projectId },
        body: form
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
  };
}

// src/components/TriggerButton.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var MegaphoneIcon = () => /* @__PURE__ */ jsxs(
  "svg",
  {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: [
      /* @__PURE__ */ jsx("path", { d: "m3 11 18-5v12L3 13v-2z" }),
      /* @__PURE__ */ jsx("path", { d: "M11.6 16.8a3 3 0 1 1-5.8-1.6" })
    ]
  }
);
var TriggerButton = ({
  onClick,
  position,
  accentColor,
  triggerText
}) => {
  const positionClass = position === "bottom-left" ? "smw-trigger--bottom-left" : "smw-trigger--bottom-right";
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      className: `smw-trigger ${positionClass}`,
      style: { "--smw-accent": accentColor },
      onClick,
      "aria-label": triggerText,
      children: [
        /* @__PURE__ */ jsx(MegaphoneIcon, {}),
        /* @__PURE__ */ jsx("span", { className: "smw-trigger__text", children: triggerText })
      ]
    }
  );
};

// src/components/Modal.tsx
import { useCallback as useCallback3, useEffect, useRef as useRef2 } from "react";

// src/components/SubmitForm.tsx
import { useState as useState2, useCallback as useCallback2 } from "react";

// src/components/ImageUpload.tsx
import { useCallback, useRef, useState } from "react";
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
var MAX_SIZE = 5 * 1024 * 1024;
var UploadIcon = () => /* @__PURE__ */ jsxs2(
  "svg",
  {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: [
      /* @__PURE__ */ jsx2("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
      /* @__PURE__ */ jsx2("polyline", { points: "17 8 12 3 7 8" }),
      /* @__PURE__ */ jsx2("line", { x1: "12", y1: "3", x2: "12", y2: "15" })
    ]
  }
);
var CloseIcon = () => /* @__PURE__ */ jsxs2(
  "svg",
  {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: [
      /* @__PURE__ */ jsx2("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
      /* @__PURE__ */ jsx2("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
    ]
  }
);
var ImageUpload = ({
  api,
  imageUrl,
  onImageUrl
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only JPEG, PNG, GIF, and WebP images are allowed.";
    }
    if (file.size > MAX_SIZE) {
      return "Image must be less than 5MB.";
    }
    return null;
  };
  const uploadFile = useCallback(
    async (file) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      setUploading(true);
      setProgress(0);
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 15, 90));
      }, 200);
      try {
        const result = await api.uploadImage(file);
        setProgress(100);
        onImageUrl(result.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        clearInterval(progressInterval);
        setUploading(false);
        setProgress(0);
      }
    },
    [api, onImageUrl]
  );
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );
  const handleFileSelect = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [uploadFile]
  );
  const handleRemove = useCallback(() => {
    onImageUrl(null);
    setError(null);
  }, [onImageUrl]);
  if (imageUrl) {
    return /* @__PURE__ */ jsxs2("div", { className: "smw-image-upload__preview", children: [
      /* @__PURE__ */ jsx2("img", { src: imageUrl, alt: "Uploaded", className: "smw-image-upload__img" }),
      /* @__PURE__ */ jsx2(
        "button",
        {
          type: "button",
          className: "smw-image-upload__remove",
          onClick: handleRemove,
          "aria-label": "Remove image",
          children: /* @__PURE__ */ jsx2(CloseIcon, {})
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs2("div", { className: "smw-image-upload", children: [
    /* @__PURE__ */ jsxs2(
      "div",
      {
        className: `smw-image-upload__dropzone ${dragging ? "smw-image-upload__dropzone--active" : ""}`,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop,
        onClick: () => inputRef.current?.click(),
        role: "button",
        tabIndex: 0,
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        },
        children: [
          /* @__PURE__ */ jsx2(
            "input",
            {
              ref: inputRef,
              type: "file",
              accept: ".jpg,.jpeg,.png,.gif,.webp",
              onChange: handleFileSelect,
              className: "smw-image-upload__input",
              tabIndex: -1
            }
          ),
          uploading ? /* @__PURE__ */ jsxs2("div", { className: "smw-image-upload__progress", children: [
            /* @__PURE__ */ jsx2(
              "div",
              {
                className: "smw-image-upload__progress-bar",
                style: { width: `${progress}%` }
              }
            ),
            /* @__PURE__ */ jsxs2("span", { className: "smw-image-upload__progress-text", children: [
              "Uploading... ",
              progress,
              "%"
            ] })
          ] }) : /* @__PURE__ */ jsxs2(Fragment, { children: [
            /* @__PURE__ */ jsx2(UploadIcon, {}),
            /* @__PURE__ */ jsx2("span", { className: "smw-image-upload__label", children: "Drop an image here or click to upload" }),
            /* @__PURE__ */ jsx2("span", { className: "smw-image-upload__hint", children: "JPEG, PNG, GIF, WebP (max 5MB)" })
          ] })
        ]
      }
    ),
    error && /* @__PURE__ */ jsx2("p", { className: "smw-image-upload__error", children: error })
  ] });
};

// src/components/SubmitForm.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var TYPE_CONFIG = {
  bug: { label: "Bug", emoji: "\u{1F41B}" },
  feature: { label: "Feature", emoji: "\u2728" },
  feedback: { label: "Feedback", emoji: "\u{1F4AC}" }
};
var CheckIcon = () => /* @__PURE__ */ jsxs3(
  "svg",
  {
    width: "48",
    height: "48",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: [
      /* @__PURE__ */ jsx3("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
      /* @__PURE__ */ jsx3("polyline", { points: "22 4 12 14.01 9 11.01" })
    ]
  }
);
var SubmitForm = ({
  api,
  userEmail,
  userName,
  types,
  accentColor
}) => {
  const [selectedType, setSelectedType] = useState2(types[0] || "feedback");
  const [title, setTitle] = useState2("");
  const [description, setDescription] = useState2("");
  const [imageUrl, setImageUrl] = useState2(null);
  const [email, setEmail] = useState2(userEmail || "");
  const [name, setName] = useState2(userName || "");
  const [submitting, setSubmitting] = useState2(false);
  const [submitted, setSubmitted] = useState2(false);
  const [error, setError] = useState2(null);
  const resetForm = useCallback2(() => {
    setSelectedType(types[0] || "feedback");
    setTitle("");
    setDescription("");
    setImageUrl(null);
    if (!userEmail) setEmail("");
    if (!userName) setName("");
    setError(null);
  }, [types, userEmail, userName]);
  const handleSubmit = useCallback2(
    async (e) => {
      e.preventDefault();
      setError(null);
      const resolvedEmail = userEmail || email;
      if (!resolvedEmail.trim()) {
        setError("Email is required.");
        return;
      }
      if (!title.trim()) {
        setError("Title is required.");
        return;
      }
      if (!description.trim()) {
        setError("Description is required.");
        return;
      }
      setSubmitting(true);
      try {
        const payload = {
          type: selectedType,
          title: title.trim(),
          description: description.trim(),
          submitter_email: resolvedEmail.trim()
        };
        if (imageUrl) payload.image_url = imageUrl;
        const resolvedName = userName || name;
        if (resolvedName.trim()) payload.submitter_name = resolvedName.trim();
        await api.submitFeedback(payload);
        setSubmitted(true);
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setSubmitting(false);
      }
    },
    [api, selectedType, title, description, imageUrl, email, name, userEmail, userName, resetForm]
  );
  if (submitted) {
    return /* @__PURE__ */ jsxs3("div", { className: "smw-submit-success", children: [
      /* @__PURE__ */ jsx3("div", { className: "smw-submit-success__icon", style: { color: accentColor }, children: /* @__PURE__ */ jsx3(CheckIcon, {}) }),
      /* @__PURE__ */ jsx3("h3", { className: "smw-submit-success__title", children: "Thank you!" }),
      /* @__PURE__ */ jsx3("p", { className: "smw-submit-success__message", children: "Your feedback has been submitted successfully." }),
      /* @__PURE__ */ jsx3(
        "button",
        {
          type: "button",
          className: "smw-btn smw-btn--primary",
          style: { "--smw-accent": accentColor },
          onClick: () => setSubmitted(false),
          children: "Submit another"
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs3("form", { className: "smw-submit-form", onSubmit: handleSubmit, children: [
    /* @__PURE__ */ jsxs3("div", { className: "smw-field", children: [
      /* @__PURE__ */ jsx3("label", { className: "smw-label", children: "Type" }),
      /* @__PURE__ */ jsx3("div", { className: "smw-type-selector", children: types.map((type) => /* @__PURE__ */ jsxs3(
        "button",
        {
          type: "button",
          className: `smw-type-btn smw-type-btn--${type} ${selectedType === type ? "smw-type-btn--active" : ""}`,
          onClick: () => setSelectedType(type),
          children: [
            /* @__PURE__ */ jsx3("span", { className: "smw-type-btn__emoji", children: TYPE_CONFIG[type].emoji }),
            TYPE_CONFIG[type].label
          ]
        },
        type
      )) })
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "smw-field", children: [
      /* @__PURE__ */ jsxs3("label", { className: "smw-label", htmlFor: "smw-title", children: [
        "Title ",
        /* @__PURE__ */ jsx3("span", { className: "smw-required", children: "*" })
      ] }),
      /* @__PURE__ */ jsx3(
        "input",
        {
          id: "smw-title",
          type: "text",
          className: "smw-input",
          placeholder: "Brief summary",
          value: title,
          onChange: (e) => setTitle(e.target.value),
          maxLength: 200,
          required: true
        }
      )
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "smw-field", children: [
      /* @__PURE__ */ jsxs3("label", { className: "smw-label", htmlFor: "smw-description", children: [
        "Description ",
        /* @__PURE__ */ jsx3("span", { className: "smw-required", children: "*" })
      ] }),
      /* @__PURE__ */ jsx3(
        "textarea",
        {
          id: "smw-description",
          className: "smw-textarea",
          placeholder: "Provide more details...",
          value: description,
          onChange: (e) => setDescription(e.target.value),
          rows: 4,
          maxLength: 5e3,
          required: true
        }
      )
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "smw-field", children: [
      /* @__PURE__ */ jsx3("label", { className: "smw-label", children: "Screenshot (optional)" }),
      /* @__PURE__ */ jsx3(ImageUpload, { api, imageUrl, onImageUrl: setImageUrl })
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "smw-field", children: [
      /* @__PURE__ */ jsxs3("label", { className: "smw-label", htmlFor: "smw-email", children: [
        "Email ",
        /* @__PURE__ */ jsx3("span", { className: "smw-required", children: "*" })
      ] }),
      userEmail ? /* @__PURE__ */ jsx3(
        "input",
        {
          id: "smw-email",
          type: "email",
          className: "smw-input smw-input--disabled",
          value: userEmail,
          disabled: true
        }
      ) : /* @__PURE__ */ jsx3(
        "input",
        {
          id: "smw-email",
          type: "email",
          className: "smw-input",
          placeholder: "you@example.com",
          value: email,
          onChange: (e) => setEmail(e.target.value),
          required: true
        }
      )
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "smw-field", children: [
      /* @__PURE__ */ jsx3("label", { className: "smw-label", htmlFor: "smw-name", children: "Name" }),
      userName ? /* @__PURE__ */ jsx3(
        "input",
        {
          id: "smw-name",
          type: "text",
          className: "smw-input smw-input--disabled",
          value: userName,
          disabled: true
        }
      ) : /* @__PURE__ */ jsx3(
        "input",
        {
          id: "smw-name",
          type: "text",
          className: "smw-input",
          placeholder: "Your name (optional)",
          value: name,
          onChange: (e) => setName(e.target.value)
        }
      )
    ] }),
    error && /* @__PURE__ */ jsx3("p", { className: "smw-error", children: error }),
    /* @__PURE__ */ jsx3(
      "button",
      {
        type: "submit",
        className: "smw-btn smw-btn--primary smw-btn--full",
        style: { "--smw-accent": accentColor },
        disabled: submitting,
        children: submitting ? /* @__PURE__ */ jsxs3("span", { className: "smw-btn__loading", children: [
          /* @__PURE__ */ jsx3("span", { className: "smw-spinner" }),
          "Submitting..."
        ] }) : "Submit Feedback"
      }
    )
  ] });
};

// src/components/Modal.tsx
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var CloseIcon2 = () => /* @__PURE__ */ jsxs4(
  "svg",
  {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: [
      /* @__PURE__ */ jsx4("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
      /* @__PURE__ */ jsx4("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
    ]
  }
);
var Modal = ({
  isOpen,
  onClose,
  api,
  userEmail,
  userName,
  types,
  accentColor
}) => {
  const modalRef = useRef2(null);
  const handleKeyDown = useCallback3(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);
  const handleBackdropClick = useCallback3(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx4("div", { className: "smw-overlay", onClick: handleBackdropClick, children: /* @__PURE__ */ jsxs4(
    "div",
    {
      ref: modalRef,
      className: "smw-modal",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Feedback",
      children: [
        /* @__PURE__ */ jsxs4("div", { className: "smw-modal__header", children: [
          /* @__PURE__ */ jsx4("h2", { className: "smw-modal__title", children: "Feedback" }),
          /* @__PURE__ */ jsx4(
            "button",
            {
              type: "button",
              className: "smw-modal__close",
              onClick: onClose,
              "aria-label": "Close",
              children: /* @__PURE__ */ jsx4(CloseIcon2, {})
            }
          )
        ] }),
        /* @__PURE__ */ jsx4("div", { className: "smw-modal__body", children: /* @__PURE__ */ jsx4(
          SubmitForm,
          {
            api,
            userEmail,
            userName,
            types,
            accentColor
          }
        ) })
      ]
    }
  ) });
};

// src/FeedbackWidget.tsx
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
var DEFAULT_TYPES = ["bug", "feature", "feedback"];
var DEFAULT_ACCENT = "#1464ff";
var DEFAULT_TRIGGER_TEXT = "Feedback";
var FeedbackWidget = ({
  projectId,
  apiBaseUrl,
  userEmail,
  userName,
  types,
  position = "bottom-right",
  theme = "auto",
  accentColor = DEFAULT_ACCENT,
  triggerText = DEFAULT_TRIGGER_TEXT
}) => {
  const [isOpen, setIsOpen] = useState3(false);
  const api = useMemo(
    () => createApiClient(projectId, apiBaseUrl),
    [projectId, apiBaseUrl]
  );
  const resolvedTypes = types && types.length > 0 ? types : [...DEFAULT_TYPES];
  const themeClass = theme === "light" ? "smw--light" : theme === "dark" ? "smw--dark" : "smw--auto";
  return /* @__PURE__ */ jsxs5(
    "div",
    {
      "data-saasmaker-widget": "",
      className: `smw-root ${themeClass}`,
      style: { "--smw-accent": accentColor },
      children: [
        /* @__PURE__ */ jsx5(
          TriggerButton,
          {
            onClick: () => setIsOpen(true),
            position,
            accentColor,
            triggerText
          }
        ),
        /* @__PURE__ */ jsx5(
          Modal,
          {
            isOpen,
            onClose: () => setIsOpen(false),
            api,
            userEmail,
            userName,
            types: resolvedTypes,
            accentColor
          }
        )
      ]
    }
  );
};
export {
  FeedbackWidget
};
