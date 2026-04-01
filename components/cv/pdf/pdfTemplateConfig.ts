export type PdfMainSectionKey =
  | "workExperience"
  | "education"
  | "fortbildungen"
  | "additionalSections";

export type PdfSidebarSectionKey = "contact" | "languages";

export type PdfTemplateConfig = {
  templateTitle: string;
  layout: "sidebar-left";
  density: "compact" | "comfortable";
  sidebarWidth: string;
  dateColumnWidth: number;
  photoShape: "circle" | "roundedRect";
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
  density: "comfortable",
  sidebarWidth: "32%",
  dateColumnWidth: 102,
  photoShape: "circle",
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

export const clinicEdgePdfTemplateConfig: PdfTemplateConfig = {
  templateTitle: "Clinic Edge",
  layout: "sidebar-left",
  density: "compact",
  sidebarWidth: "31%",
  dateColumnWidth: 122,
  photoShape: "roundedRect",
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
