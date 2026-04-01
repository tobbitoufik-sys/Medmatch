export type PdfMainSectionKey =
  | "workExperience"
  | "education"
  | "fortbildungen"
  | "additionalSections";

export type PdfSidebarSectionKey = "contact" | "languages";

export type PdfTemplateConfig = {
  templateTitle: string;
  layout: "sidebar-left";
  variant?: "standard" | "softTimeline" | "slateProfile";
  density: "compact" | "comfortable";
  sidebarWidth: string;
  dateColumnWidth: number;
  photoShape: "circle" | "roundedRect";
  theme: {
    shellBorderWidth?: number;
    shellShadowTone?: string;
    sidebarNameColor: string;
    sidebarSubtitleColor: string;
    kickerColor: string;
    fullNameColor: string;
    subtitleColor: string;
    sectionTitleColor: string;
    entryTitleColor: string;
    entrySubtitleColor: string;
    entryMetaColor: string;
    entryDateColor: string;
    bulletColor: string;
    accentBarColor?: string;
    accentBarHeight?: number;
  };
  leftColumnSections: PdfSidebarSectionKey[];
  rightColumnSections: PdfMainSectionKey[];
  page: {
    backgroundColor: string;
  };
  shell: {
    margin: number;
    radius: number;
    backgroundColor: string;
    borderColor: string;
  };
  sidebar: {
    backgroundColor: string;
    paddingHorizontal: number;
    paddingTop: number;
    paddingBottom: number;
    blockDividerColor?: string;
    blockGap: number;
    blockPaddingBottom?: number;
    photo: {
      width: number | string;
      height: number;
      radius: number;
      borderColor: string;
      borderWidth: number;
      marginBottom: number;
      objectPosition?: string;
    };
    identity?: {
      show: boolean;
      nameSize: number;
      subtitleSize: number;
      subtitleMarginBottom: number;
    };
  };
  main: {
    paddingHorizontal: number;
    paddingTop: number;
    paddingBottom: number;
  };
  header: {
    showKicker: boolean;
    showName: boolean;
    showSubtitle: boolean;
    topBorderColor?: string;
    paddingTop?: number;
    paddingBottom?: number;
    kickerLetterSpacing: number;
  };
  sections: {
    topBorderColor?: string;
    titleLetterSpacing: number;
    titleSize: number;
  };
};

export const modernPdfTemplateConfig: PdfTemplateConfig = {
  templateTitle: "Lebenslauf",
  layout: "sidebar-left",
  variant: "standard",
  density: "comfortable",
  sidebarWidth: "32%",
  dateColumnWidth: 102,
  photoShape: "circle",
  theme: {
    shellBorderWidth: 1,
    sidebarNameColor: "#162033",
    sidebarSubtitleColor: "#4c6270",
    kickerColor: "#8ea1af",
    fullNameColor: "#101828",
    subtitleColor: "#536576",
    sectionTitleColor: "#566877",
    entryTitleColor: "#162033",
    entrySubtitleColor: "#425567",
    entryMetaColor: "#61717f",
    entryDateColor: "#6b7280",
    bulletColor: "#314152"
  },
  leftColumnSections: ["contact", "languages"],
  rightColumnSections: ["workExperience", "education", "fortbildungen", "additionalSections"],
  page: {
    backgroundColor: "#eef2f5"
  },
  shell: {
    margin: 16,
    radius: 22,
    backgroundColor: "#fdfdfb",
    borderColor: "#d8e0e3"
  },
  sidebar: {
    backgroundColor: "#e3ece8",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
    blockGap: 18,
    photo: {
      width: 124,
      height: 124,
      radius: 62,
      borderColor: "#f4f7f6",
      borderWidth: 4,
      marginBottom: 18,
      objectPosition: "center"
    },
    identity: {
      show: true,
      nameSize: 17,
      subtitleSize: 10.4,
      subtitleMarginBottom: 22
    }
  },
  main: {
    paddingHorizontal: 30,
    paddingTop: 28,
    paddingBottom: 30
  },
  header: {
    showKicker: true,
    showName: true,
    showSubtitle: true,
    kickerLetterSpacing: 1.6
  },
  sections: {
    titleLetterSpacing: 1.1,
    titleSize: 9.7
  }
};

export const medmatchPremiumPdfTemplateConfig: PdfTemplateConfig = {
  templateTitle: "MedMatch Premium",
  layout: "sidebar-left",
  variant: "standard",
  density: "comfortable",
  sidebarWidth: "33%",
  dateColumnWidth: 106,
  photoShape: "circle",
  theme: {
    shellBorderWidth: 2,
    shellShadowTone: "#b8c9cf",
    sidebarNameColor: "#0f2740",
    sidebarSubtitleColor: "#2d5163",
    kickerColor: "#5c8b8d",
    fullNameColor: "#10263c",
    subtitleColor: "#39586c",
    sectionTitleColor: "#2b6f73",
    entryTitleColor: "#10263c",
    entrySubtitleColor: "#35586b",
    entryMetaColor: "#567487",
    entryDateColor: "#2b6f73",
    bulletColor: "#284457",
    accentBarColor: "#7cb6b0",
    accentBarHeight: 6
  },
  leftColumnSections: ["contact", "languages"],
  rightColumnSections: ["workExperience", "education", "fortbildungen", "additionalSections"],
  page: {
    backgroundColor: "#e6eef0"
  },
  shell: {
    margin: 14,
    radius: 26,
    backgroundColor: "#fffefb",
    borderColor: "#c8d8dd"
  },
  sidebar: {
    backgroundColor: "#d8e7e4",
    paddingHorizontal: 26,
    paddingTop: 30,
    paddingBottom: 30,
    blockDividerColor: "#b8d0d0",
    blockGap: 20,
    blockPaddingBottom: 16,
    photo: {
      width: 132,
      height: 132,
      radius: 66,
      borderColor: "#f6faf8",
      borderWidth: 5,
      marginBottom: 20,
      objectPosition: "center 14%"
    },
    identity: {
      show: true,
      nameSize: 18,
      subtitleSize: 10.8,
      subtitleMarginBottom: 24
    }
  },
  main: {
    paddingHorizontal: 32,
    paddingTop: 30,
    paddingBottom: 32
  },
  header: {
    showKicker: true,
    showName: true,
    showSubtitle: true,
    topBorderColor: "#d6e0e6",
    paddingTop: 16,
    paddingBottom: 20,
    kickerLetterSpacing: 1.75
  },
  sections: {
    topBorderColor: "#d7e1e6",
    titleLetterSpacing: 1.2,
    titleSize: 9.9
  }
};

export const clinicEdgePdfTemplateConfig: PdfTemplateConfig = {
  templateTitle: "Clinic Edge",
  layout: "sidebar-left",
  variant: "standard",
  density: "compact",
  sidebarWidth: "31%",
  dateColumnWidth: 122,
  photoShape: "roundedRect",
  theme: {
    shellBorderWidth: 1,
    sidebarNameColor: "#162033",
    sidebarSubtitleColor: "#4c6270",
    kickerColor: "#8ea1af",
    fullNameColor: "#101828",
    subtitleColor: "#536576",
    sectionTitleColor: "#566877",
    entryTitleColor: "#162033",
    entrySubtitleColor: "#425567",
    entryMetaColor: "#61717f",
    entryDateColor: "#6b7280",
    bulletColor: "#314152"
  },
  leftColumnSections: ["contact", "languages"],
  rightColumnSections: ["workExperience", "education", "fortbildungen", "additionalSections"],
  page: {
    backgroundColor: "#f3f6f7"
  },
  shell: {
    margin: 14,
    radius: 18,
    backgroundColor: "#fffdfb",
    borderColor: "#dbe3e8"
  },
  sidebar: {
    backgroundColor: "#dfe7e4",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
    blockDividerColor: "#cad6db",
    blockGap: 18,
    blockPaddingBottom: 16,
    photo: {
      width: "100%",
      height: 214,
      radius: 24,
      borderColor: "#f7f9f8",
      borderWidth: 3,
      marginBottom: 24,
      objectPosition: "center 18%"
    },
    identity: {
      show: false,
      nameSize: 17,
      subtitleSize: 10.4,
      subtitleMarginBottom: 0
    }
  },
  main: {
    paddingHorizontal: 30,
    paddingTop: 28,
    paddingBottom: 30
  },
  header: {
    showKicker: true,
    showName: true,
    showSubtitle: true,
    topBorderColor: "#d7e0e6",
    paddingTop: 16,
    paddingBottom: 18,
    kickerLetterSpacing: 1.25
  },
  sections: {
    topBorderColor: "#dbe3e8",
    titleLetterSpacing: 0.85,
    titleSize: 9.1
  }
};

export const softTimelinePdfTemplateConfig: PdfTemplateConfig = {
  templateTitle: "Soft Timeline",
  layout: "sidebar-left",
  variant: "softTimeline",
  density: "comfortable",
  sidebarWidth: "30%",
  dateColumnWidth: 86,
  photoShape: "circle",
  theme: {
    shellBorderWidth: 0,
    sidebarNameColor: "#222222",
    sidebarSubtitleColor: "#4F4F4F",
    kickerColor: "#6F6F6F",
    fullNameColor: "#222222",
    subtitleColor: "#4F4F4F",
    sectionTitleColor: "#222222",
    entryTitleColor: "#222222",
    entrySubtitleColor: "#4F4F4F",
    entryMetaColor: "#6F6F6F",
    entryDateColor: "#6F6F6F",
    bulletColor: "#4F4F4F",
    accentBarColor: "#8FC7D2",
    accentBarHeight: 4
  },
  leftColumnSections: ["contact", "languages"],
  rightColumnSections: ["workExperience", "education", "fortbildungen", "additionalSections"],
  page: {
    backgroundColor: "#F3F3F1"
  },
  shell: {
    margin: 0,
    radius: 0,
    backgroundColor: "#F3F3F1",
    borderColor: "#F3F3F1"
  },
  sidebar: {
    backgroundColor: "#F3F3F1",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 26,
    blockDividerColor: "#D9D9D6",
    blockGap: 18,
    blockPaddingBottom: 14,
    photo: {
      width: 126,
      height: 126,
      radius: 63,
      borderColor: "#FFFFFF",
      borderWidth: 6,
      marginBottom: 20,
      objectPosition: "center 16%"
    },
    identity: {
      show: false,
      nameSize: 17,
      subtitleSize: 10.4,
      subtitleMarginBottom: 0
    }
  },
  main: {
    paddingHorizontal: 26,
    paddingTop: 24,
    paddingBottom: 26
  },
  header: {
    showKicker: false,
    showName: true,
    showSubtitle: true,
    topBorderColor: "#D9D9D6",
    paddingTop: 0,
    paddingBottom: 20,
    kickerLetterSpacing: 1.2
  },
  sections: {
    topBorderColor: "#D9D9D6",
    titleLetterSpacing: 0.9,
    titleSize: 10
  }
};

export const slateProfilePdfTemplateConfig: PdfTemplateConfig = {
  templateTitle: "Slate Profile",
  layout: "sidebar-left",
  variant: "slateProfile",
  density: "comfortable",
  sidebarWidth: "0%",
  dateColumnWidth: 108,
  photoShape: "circle",
  theme: {
    shellBorderWidth: 0,
    sidebarNameColor: "#222222",
    sidebarSubtitleColor: "#4F4F4F",
    kickerColor: "#6F6F6F",
    fullNameColor: "#222222",
    subtitleColor: "#4F4F4F",
    sectionTitleColor: "#222222",
    entryTitleColor: "#222222",
    entrySubtitleColor: "#4F4F4F",
    entryMetaColor: "#6F6F6F",
    entryDateColor: "#6F6F6F",
    bulletColor: "#4F4F4F"
  },
  leftColumnSections: ["contact", "languages"],
  rightColumnSections: ["workExperience", "education", "fortbildungen", "additionalSections"],
  page: {
    backgroundColor: "#F3F3F1"
  },
  shell: {
    margin: 0,
    radius: 0,
    backgroundColor: "#F3F3F1",
    borderColor: "#F3F3F1"
  },
  sidebar: {
    backgroundColor: "#F3F3F1",
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    blockGap: 0,
    photo: {
      width: 132,
      height: 132,
      radius: 66,
      borderColor: "#111827",
      borderWidth: 9,
      marginBottom: 0,
      objectPosition: "center 16%"
    }
  },
  main: {
    paddingHorizontal: 26,
    paddingTop: 22,
    paddingBottom: 28
  },
  header: {
    showKicker: false,
    showName: false,
    showSubtitle: false,
    kickerLetterSpacing: 1
  },
  sections: {
    topBorderColor: "#CFCFCA",
    titleLetterSpacing: 0.4,
    titleSize: 11
  }
};
